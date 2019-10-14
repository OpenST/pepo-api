const uuidV4 = require('uuid/v4'),
  BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetBalance = require(rootPrefix + '/app/services/user/GetBalance'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  OstPricePointModel = require(rootPrefix + '/app/models/mysql/OstPricePoints'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  RedemptionProductsCache = require(rootPrefix + '/lib/cacheManagement/single/RedemptionProducts'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  emailConstants = require(rootPrefix + '/lib/globalConstant/email'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

/**
 * Class to request redemption for user.
 *
 * @class RequestRedemption
 */
class RequestRedemption extends ServiceBase {
  /**
   * Constructor to request redemption for user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.product_id
   * @param {string} params.price_point
   * @param {string} params.pepo_amount_in_wei
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.productId = params.product_id;
    oThis.pricePoint = params.price_point;
    oThis.pepoAmountInWei = params.pepo_amount_in_wei;

    oThis.currentUserId = oThis.currentUser.id;

    oThis.productLink = null;
    oThis.dollarValue = null;
    oThis.productKind = null;
    oThis.redemptionReceiverUsername = null;
    oThis.currentUserTokenHolderAddress = null;
    oThis.currentUserEmailAddress = null;
    oThis.currentUserUserName = null;
    oThis.redemptionReceiverTokenHolderAddress = null;
    oThis.currentUserTwitterHandle = null;
  }

  /**
   * Async perform.
   *
   * @sets oThis.redemptionId
   *
   * @returns {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSetUserDetails();

    await oThis._validateAndSanitize();

    const promisesArray = [];
    promisesArray.push(oThis._getTokenUserDetails(), oThis._getCurrentUserTwitterHandle());
    await Promise.all(promisesArray);

    oThis.redemptionId = uuidV4();

    oThis._prepareSendMailParams();

    await oThis._enqueAfterRedemptionJob();

    return responseHelper.successWithData({
      redemption: {
        id: oThis.redemptionId,
        userId: oThis.currentUserId,
        productId: oThis.productId,
        uts: parseInt(Date.now() / 1000)
      }
    });
  }

  /**
   * Validate and set user details.
   *
   * @sets oThis.currentUserEmailAddress, oThis.currentUserUserName, oThis.redemptionReceiverUsername
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSetUserDetails() {
    const oThis = this;

    const userDetailsCacheRsp = await new UserMultiCache({
      ids: [oThis.currentUserId, coreConstants.PEPO_REDEMPTION_USER_ID]
    }).fetch();
    if (userDetailsCacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_r_1',
          api_error_identifier: 'something_went_wrong_bad_request',
          debug_options: { error: userDetailsCacheRsp }
        })
      );
    }

    const currentUserDetails = userDetailsCacheRsp.data[oThis.currentUserId];

    if (!currentUserDetails || !UserModel.isUserApprovedCreator(currentUserDetails)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_r_2',
          api_error_identifier: 'redemption_user_not_approved_creator',
          debug_options: {}
        })
      );
    }

    const redemptionUserDetails = userDetailsCacheRsp.data[coreConstants.PEPO_REDEMPTION_USER_ID];

    oThis.currentUserEmailAddress = currentUserDetails.email || '';
    oThis.currentUserUserName = currentUserDetails.userName;
    oThis.redemptionReceiverUsername = redemptionUserDetails.userName;
  }

  /**
   * Validate and sanitize params.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    await oThis._validateUserBalance();
    await oThis._validatePricePoint();
    await oThis._validateAndSetProductDetails();
    await oThis._validateProductValue();
  }

  /**
   * Fetch and validate if pepo amount in wei is lesser than the user balance or not.
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _validateUserBalance() {
    const oThis = this;

    // Validate pepo amount in wei < = balance.
    const balanceResponse = await new GetBalance({ user_id: oThis.currentUserId }).perform();
    if (balanceResponse.isFailure()) {
      return Promise.reject(balanceResponse);
    }

    const pepoAmountInBn = new BigNumber(oThis.pepoAmountInWei),
      balanceInBn = new BigNumber(balanceResponse.data.balance.total_balance);

    if (pepoAmountInBn.gt(balanceInBn)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_r_3',
          api_error_identifier: 'redemption_user_has_insufficient_balance',
          debug_options: {}
        })
      );
    }
  }

  /**
   * Validate price point.
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _validatePricePoint() {
    const oThis = this;

    const currentTimeInSeconds = Math.round(Date.now() / 1000);

    const dbRows = await new OstPricePointModel()
      .select('conversion_rate')
      .where([
        'created_at > (?) AND quote_currency = (?)',
        currentTimeInSeconds - 3600,
        ostPricePointConstants.invertedQuoteCurrencies[ostPricePointConstants.usdQuoteCurrency]
      ])
      .fire();

    let validationResult = false;
    for (let index = 0; index < dbRows.length; index++) {
      const pricePointEntity = dbRows[index];

      if (new BigNumber(pricePointEntity.conversion_rate).eq(new BigNumber(oThis.pricePoint))) {
        validationResult = true;
      }
    }

    if (!validationResult) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_r_4',
          api_error_identifier: 'something_went_wrong_bad_request',
          debug_options: {}
        })
      );
    }
  }

  /**
   * Get redemption product details.
   *
   * @sets oThis.productLink, oThis.dollarValue
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _validateAndSetProductDetails() {
    const oThis = this;

    const redemptionProductsCacheResponse = await new RedemptionProductsCache().fetch();
    if (redemptionProductsCacheResponse.isFailure()) {
      return Promise.reject(redemptionProductsCacheResponse);
    }

    const redemptionProducts = redemptionProductsCacheResponse.data.products;

    let validationResult = false;
    for (let index = 0; index < redemptionProducts.length; index++) {
      const redemptionProduct = redemptionProducts[index];

      if (+redemptionProduct.id === +oThis.productId) {
        validationResult = true;
        oThis.productLink = redemptionProduct.images.landscape;
        oThis.dollarValue = redemptionProduct.dollarValue;
        oThis.productKind = redemptionProduct.kind;
      }
    }

    if (!validationResult) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_r_5',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_product_id'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Validate if product value is correct or not.
   *
   * @returns {boolean}
   * @private
   */
  async _validateProductValue() {
    const oThis = this;

    const productValueInUsdInWei = basicHelper.getUSDAmountForPepo(oThis.pricePoint, oThis.pepoAmountInWei);

    const productValueInUsd = basicHelper.toNormalPrecisionFiat(productValueInUsdInWei, 18).toString();

    if (productValueInUsd !== oThis.dollarValue) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_r_6',
          api_error_identifier: 'something_went_wrong_bad_request',
          debug_options: {}
        })
      );
    }
  }

  /**
   * Get token user details.
   *
   * @sets oThis.currentUserTokenHolderAddress, oThis.redemptionReceiverTokenHolderAddress
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getTokenUserDetails() {
    const oThis = this;

    const tokenUserCacheResponse = await new TokenUserByUserIdCache({
      userIds: [oThis.currentUserId, coreConstants.PEPO_REDEMPTION_USER_ID]
    }).fetch();

    if (tokenUserCacheResponse.isFailure()) {
      return Promise.reject(tokenUserCacheResponse);
    }

    oThis.currentUserTokenHolderAddress = tokenUserCacheResponse.data[oThis.currentUserId].ostTokenHolderAddress;
    oThis.redemptionReceiverTokenHolderAddress =
      tokenUserCacheResponse.data[coreConstants.PEPO_REDEMPTION_USER_ID].ostTokenHolderAddress;
  }

  /**
   * Get current user twitter handle.
   *
   * @sets oThis.currentUserTwitterHandle
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getCurrentUserTwitterHandle() {
    const oThis = this;

    const twitterUserByUserIdsCacheResponse = await new TwitterUserByUserIdsCache({
      userIds: [oThis.currentUserId]
    }).fetch();
    if (twitterUserByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResponse);
    }

    const currentUserTwitterId = twitterUserByUserIdsCacheResponse.data[oThis.currentUserId].id;

    const twitterUserByUserIdCacheResponse = await new TwitterUserByIdsCache({ ids: [currentUserTwitterId] }).fetch();
    if (twitterUserByUserIdCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdCacheResponse);
    }

    oThis.currentUserTwitterHandle = twitterUserByUserIdCacheResponse.data[currentUserTwitterId].handle || '';
  }

  /**
   * Prepare send mail params.
   *
   * @sets oThis.transactionalMailParams
   *
   * @private
   */
  _prepareSendMailParams() {
    const oThis = this;

    oThis.transactionalMailParams = {
      receiverEntityId: 0,
      receiverEntityKind: emailServiceApiCallHookConstants.hookParamsInternalEmailEntityKind,
      templateName: emailServiceApiCallHookConstants.userRedemptionTemplateName,
      templateVars: {
        // User details.
        username: oThis.currentUserUserName,
        user_id: oThis.currentUserId,
        user_token_holder_address: oThis.currentUserTokenHolderAddress,
        user_twitter_handle: oThis.currentUserTwitterHandle,
        user_email: oThis.currentUserEmailAddress,
        user_admin_url_prefix: basicHelper.userProfilePrefixUrl(),
        // Product details.
        product_id: oThis.productId,
        product_kind: oThis.productKind,
        product_link: oThis.productLink,
        product_dollar_value: oThis.dollarValue,
        // Redemption details.
        redemption_id: oThis.redemptionId,
        pepo_amount: basicHelper.convertWeiToNormal(oThis.pepoAmountInWei).toString(10),
        redemption_receiver_username: oThis.redemptionReceiverUsername,
        redemption_receiver_token_holder_address: oThis.redemptionReceiverTokenHolderAddress,
        pepo_api_domain: 1,
        receiverEmail: emailConstants.redemptionRequest
      }
    };
  }

  /**
   * Enque after signup job.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueAfterRedemptionJob() {
    const oThis = this;

    const messagePayload = {
      transactionalMailParams: oThis.transactionalMailParams,
      currentUserId: oThis.currentUserId,
      productKind: oThis.productKind
    };
    await bgJob.enqueue(bgJobConstants.afterRedemptionJobTopic, messagePayload);
  }
}

module.exports = RequestRedemption;

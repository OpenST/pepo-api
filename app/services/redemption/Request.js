const uuidV4 = require('uuid/v4'),
  BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetBalance = require(rootPrefix + '/app/services/user/GetBalance'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  OstPricePointModel = require(rootPrefix + '/app/models/mysql/OstPricePoints'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  TokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  RedemptionProductsCache = require(rootPrefix + '/lib/cacheManagement/single/RedemptionProducts'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  emailConstants = require(rootPrefix + '/lib/globalConstant/email'),
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
   * @return {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    const promisesArray = [];
    promisesArray.push(oThis._getUserDetails(), oThis._getTokenUserDetails(), oThis._getCurrentUserTwitterHandle());
    await Promise.all(promisesArray);

    oThis.redemptionId = uuidV4();

    await oThis._sendEmail();

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
   * Validate and sanitize params.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    const paramErrors = [];
    const promisesArray = [oThis._validateUserBalance(), oThis._validatePricePoint(), oThis._getProductDetails()];

    const promisesResponse = await Promise.all(promisesArray);

    const userBalanceValidationResponse = promisesResponse[0];
    const pricePointValidationResponse = promisesResponse[1];
    const productValidationResponse = promisesResponse[2];

    // Validate if user's balance is greater than the pepo amount in wei.
    if (!userBalanceValidationResponse) {
      paramErrors.push('invalid_pepo_amount_in_wei');
    }

    // Validate price points.
    if (!pricePointValidationResponse) {
      paramErrors.push('invalid_price_point');
    }

    // Validate product id.
    if (!productValidationResponse) {
      paramErrors.push('invalid_product_id');
    }

    // Validate if product value is correct or not.
    const productValueValidation = oThis._validateProductValue();

    if (!productValueValidation) {
      paramErrors.push('invalid_pepo_amount_in_wei', 'invalid_price_point');
    }

    if (paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_r_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          debug_options: { error: paramErrors }
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
  _validateProductValue() {
    const oThis = this;

    const productValueInUsdInWei = basicHelper.getUSDAmountForPepo(oThis.pricePoint, oThis.pepoAmountInWei);

    const productValueInUsd = basicHelper.toNormalPrecisionFiat(productValueInUsdInWei, 18).toString();

    return productValueInUsd === oThis.dollarValue;
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

    return !pepoAmountInBn.gt(balanceInBn);
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

    return validationResult;
  }

  /**
   * Get redemption product details.
   *
   * @sets oThis.productLink, oThis.dollarValue
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _getProductDetails() {
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

    return validationResult;
  }

  /**
   * Get user details.
   *
   * @sets oThis.currentUserEmailAddress, oThis.currentUserUserName, oThis.redemptionReceiverUsername
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getUserDetails() {
    const oThis = this;

    const userDetailsCacheRsp = await new UserMultiCache({
      ids: [oThis.currentUserId, coreConstants.PEPO_REDEMPTION_USER_ID]
    }).fetch();
    if (userDetailsCacheRsp.isFailure()) {
      return Promise.reject(userDetailsCacheRsp);
    }

    const currentUserDetails = userDetailsCacheRsp.data[oThis.currentUserId];
    const redemptionUserDetails = userDetailsCacheRsp.data[coreConstants.PEPO_REDEMPTION_USER_ID];

    oThis.currentUserEmailAddress = currentUserDetails.email || '';
    oThis.currentUserUserName = currentUserDetails.userName;
    oThis.redemptionReceiverUsername = redemptionUserDetails.userName;
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
   * Send email for initiation of redemption request.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendEmail() {
    const oThis = this;

    const transactionalMailParams = {
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

    await new SendTransactionalMail(transactionalMailParams).perform();
  }
}

module.exports = RequestRedemption;

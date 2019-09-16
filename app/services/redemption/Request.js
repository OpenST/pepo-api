const uuidV4 = require('uuid/v4'),
  BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetBalance = require(rootPrefix + '/app/services/user/GetBalance'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  OstPricePointModel = require(rootPrefix + '/app/models/mysql/OstPricePoints'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  TokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  RedemptionProductsCache = require(rootPrefix + '/lib/cacheManagement/single/RedemptionProducts'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ostPricePointConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

/**
 * Class to request redemption for user.
 *
 * @class
 */
class RequestRedemption extends ServiceBase {
  /**
   * Constructor to request redemption for user.
   *
   * @param params
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

    oThis.productLink = null;
    oThis.dollarValue = null;
    oThis.redemptionReceiverUsername = null;
    oThis.currentUserTokenHolderAddress = null;
    oThis.redemptionReceiverTokenHolderAddress = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    const promisesArray = [];
    promisesArray.push(oThis._getUserDetails());
    promisesArray.push(oThis._getTokenUserDetails());
    await Promise.all(promisesArray);

    await oThis._sendEmail();

    const redemptionId = uuidV4();

    return responseHelper.successWithData({
      redemption: {
        id: redemptionId,
        userId: oThis.currentUser.id,
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

    // Validate if user's balance is greater than the pepo amount in wei.
    if (!userBalanceValidationResponse) {
      paramErrors.push('invalid_pepo_amount_in_wei');
    }

    // Validate price points.
    if (!pricePointValidationResponse) {
      paramErrors.push('invalid_price_point');
    }

    // Validate product id.
    if (!oThis.productLink) {
      paramErrors.push('invalid_product_id');
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
   * Fetch and validate if pepo amount in wei is lesser than the user balance or not.
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _validateUserBalance() {
    const oThis = this;

    // Validate pepo amount in wei < = balance.
    const balanceResponse = await new GetBalance({ user_id: oThis.currentUser.id }).perform();
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

    let result = false;
    for (let index = 0; index < dbRows.length; index++) {
      const pricePointEntity = dbRows[index];

      if (pricePointEntity.conversion_rate === oThis.pricePoint) {
        result = true;
      }

      result = false;
    }

    return result;
  }

  /**
   * Get redemption product details.
   *
   * @sets oThis.productLink, oThis.dollarValue
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getProductDetails() {
    const oThis = this;

    const redemptionProductsCacheResponse = await new RedemptionProductsCache().fetch();
    if (redemptionProductsCacheResponse.isFailure()) {
      return Promise.reject(redemptionProductsCacheResponse);
    }

    const redemptionProducts = redemptionProductsCacheResponse.data.products;

    for (let index = 0; index < redemptionProducts.length; index++) {
      const redemptionProduct = redemptionProducts[index];

      if (redemptionProduct.id === oThis.productId) {
        oThis.productLink = redemptionProduct.images.landscape;
        oThis.dollarValue = redemptionProduct.dollarValue;
      }
    }
  }

  /**
   * Get user details.
   *
   * @sets oThis.redemptionReceiverUsername
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getUserDetails() {
    const oThis = this;

    const userDetailsCacheRsp = await new UserMultiCache({ ids: [coreConstants.PEPO_REDEMPTION_USER_ID] }).fetch();
    if (userDetailsCacheRsp.isFailure()) {
      return Promise.reject(userDetailsCacheRsp);
    }

    const userDetails = userDetailsCacheRsp.data[coreConstants.PEPO_REDEMPTION_USER_ID];

    oThis.redemptionReceiverUsername = userDetails[coreConstants.PEPO_REDEMPTION_USER_ID].userName;
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
      userIds: [oThis.currentUser.id, coreConstants.PEPO_REDEMPTION_USER_ID]
    }).fetch();

    if (tokenUserCacheResponse.isFailure()) {
      return Promise.reject(tokenUserCacheResponse);
    }

    oThis.currentUserTokenHolderAddress = tokenUserCacheResponse.data[oThis.currentUser.id].ostTokenHolderAddress;
    oThis.redemptionReceiverTokenHolderAddress =
      tokenUserCacheResponse.data[coreConstants.PEPO_REDEMPTION_USER_ID].ostTokenHolderAddress;
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
      receiverEntityId: coreConstants.PEPO_REDEMPTION_USER_ID,
      receiverEntityKind: emailServiceApiCallHookConstants.emailDoubleOptInEntityKind,
      templateName: emailServiceApiCallHookConstants.userRedemptionTemplateName,
      templateVars: {
        username: oThis.currentUser.userName,
        user_id: oThis.currentUser.id,
        user_token_holder_address: oThis.currentUserTokenHolderAddress,
        user_twitter_handle: '',
        product_id: oThis.productId,
        product_link: oThis.productLink,
        product_dollar_value: oThis.dollarValue,
        pepo_amount: basicHelper.convertWeiToNormal(oThis.pepoAmountInWei),
        redemption_receiver_username: oThis.redemptionReceiverUsername,
        redemption_receiver_token_holder_address: oThis.redemptionReceiverTokenHolderAddress
      }
    };

    await new SendTransactionalMail(transactionalMailParams).perform();
  }
}

module.exports = RequestRedemption;

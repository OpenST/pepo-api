const uuidV4 = require('uuid/v4'),
  BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetBalance = require(rootPrefix + '/app/services/user/GetBalance'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  TokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  RedemptionProductsCache = require(rootPrefix + '/lib/cacheManagement/single/RedemptionProducts'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

class GetRedemptionInfo extends ServiceBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUser = params.current_user;
    oThis.productId = params.product_id;
    oThis.pricePoint = params.price_point;
    oThis.pepoAmountInWei = params.pepo_amount_in_wei;

    oThis.productLink = null;
  }

  /**
   * async perform
   *
   * @return {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this,
      promiseArray = [];

    await oThis._validateAndSanitize();

    promiseArray.push(oThis._getUserDetails());
    promiseArray.push(oThis._getTokenUserDetails());
    await Promise.all(promiseArray);

    await oThis._sendEmail();

    let redemptionId = uuidV4();

    return Promise.resolve(
      responseHelper.successWithData({
        redemption: {
          id: redemptionId,
          userId: oThis.currentUser.id,
          productId: oThis.productId,
          uts: parseInt(Date.now() / 1000)
        }
      })
    );
  }

  /**
   * Validate and sanitize params.
   *
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this,
      paramErrors = [];

    // Validate pepo amount in wei < = balance.
    const balanceResponse = await new GetBalance({ user_id: oThis.currentUser.id }).perform();

    if (balanceResponse.isFailure()) {
      return Promise.reject(balanceResponse);
    }

    const pepoAmountInBn = new BigNumber(oThis.pepoAmountInWei),
      balanceInBn = new BigNumber(balanceResponse.data.balance.total_balance);

    if (pepoAmountInBn.gt(balanceInBn)) {
      paramErrors.push('invalid_pepo_amount_in_wei');
    }

    // Validate price points.

    // Validate product id.
    await oThis._getProductDetails();

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
   * Get user details.
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

    const userDetailsCacheRspData = userDetailsCacheRsp.data;

    oThis.redemptionReceiverUsername = userDetailsCacheRspData[coreConstants.PEPO_REDEMPTION_USER_ID].userName;
  }

  /**
   * Get token user details.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getTokenUserDetails() {
    const oThis = this;

    const tokenUserObjRes = await new TokenUserByUserIdCache({
      userIds: [oThis.currentUser.id, coreConstants.PEPO_REDEMPTION_USER_ID]
    }).fetch();

    if (tokenUserObjRes.isFailure()) {
      return Promise.reject(tokenUserObjRes);
    }

    oThis.currentUserTokenHolderAddress = tokenUserObjRes.data[oThis.currentUser.id].ostTokenHolderAddress;
    oThis.redemptionReceiverTokenHolderAddress =
      tokenUserObjRes.data[coreConstants.PEPO_REDEMPTION_USER_ID].ostTokenHolderAddress;
  }

  /**
   * Get redemption product details.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getProductDetails() {
    const oThis = this;

    const redemptionProductsCacheRsp = await new RedemptionProductsCache().fetch();

    if (redemptionProductsCacheRsp.isFailure()) {
      return Promise.reject(redemptionProductsCacheRsp);
    }

    const redemptionProducts = redemptionProductsCacheRsp.data['products'];

    for (let index = 0; index < redemptionProducts.length; index++) {
      const redemptionProduct = redemptionProducts[index];

      if (redemptionProduct.id === oThis.productId) {
        oThis.productLink = redemptionProduct.images.landscape;
        oThis.dollarValue = redemptionProduct.dollarValue;
        return;
      }
    }
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

module.exports = GetRedemptionInfo;

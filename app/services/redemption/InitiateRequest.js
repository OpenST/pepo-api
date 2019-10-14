const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  GetPepocornBalance = require(rootPrefix + '/lib/pepocorn/GetPepocornBalance'),
  PepocornBalanceModel = require(rootPrefix + '/app/models/mysql/PepocornBalance'),
  PepocornTransactionsModel = require(rootPrefix + '/app/models/mysql/PepocornTransaction'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  RedemptionProductsCache = require(rootPrefix + '/lib/cacheManagement/single/RedemptionProducts'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  emailConstants = require(rootPrefix + '/lib/globalConstant/email'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  redemptionConstants = require(rootPrefix + '/lib/globalConstant/redemption'),
  pepocornTransactionConstants = require(rootPrefix + '/lib/globalConstant/redemption/pepocornTransaction'),
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
   * @param {string} params.dollar_amount
   * @param {string} params.pepocorn_per_dollar_step
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    logger.log('params =======', params);
    oThis.currentUser = params.current_user;
    oThis.productId = params.product_id;
    oThis.dollarAmount = params.dollar_amount;

    oThis.currentUserId = oThis.currentUser.id;
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

    oThis._getPepocornAmount();

    const promisesArray = [];
    promisesArray.push(oThis._getTokenUserDetails(), oThis._getCurrentUserTwitterHandle());
    await Promise.all(promisesArray);

    oThis.redemptionId = uuidV4();

    await oThis._debitPepocornBalance();

    await oThis._insertPepocornTransactions();

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
          internal_error_identifier: 'a_s_r_ir_1',
          api_error_identifier: 'something_went_wrong_bad_request',
          debug_options: { error: userDetailsCacheRsp }
        })
      );
    }

    const currentUserDetails = userDetailsCacheRsp.data[oThis.currentUserId];

    console.log('currentUserDetails', currentUserDetails);

    if (!currentUserDetails || !UserModel.isUserApprovedCreator(currentUserDetails)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_ir_2',
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
    await oThis._validateProductId();
    await oThis._validateDollarAmount();
    await oThis._validatePepocornBalance();
  }

  /**
   * Get redemption product details and validate product id.
   *
   * @sets oThis.productLink, oThis.productDollarValue, oThis.productKind, oThis.productMinDollarValue, oThis.productDollarStep
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _validateProductId() {
    const oThis = this;

    const redemptionProductsCacheResponse = await new RedemptionProductsCache().fetch();
    if (redemptionProductsCacheResponse.isFailure()) {
      return Promise.reject(redemptionProductsCacheResponse);
    }

    const redemptionProducts = redemptionProductsCacheResponse.data.products;

    let validationResult = false;
    for (let index = 0; index < redemptionProducts.length; index++) {
      const redemptionProduct = redemptionProducts[index];

      if (+redemptionProduct.id === +oThis.productId && redemptionProduct.status === redemptionConstants.activeStatus) {
        validationResult = true;

        console.log('redemptionProduct', redemptionProduct);
        oThis.productLink = redemptionProduct.images.landscape;
        oThis.productDollarValue = redemptionProduct.dollarValue;
        oThis.productKind = redemptionProduct.kind;
        oThis.productMinDollarValue = redemptionProduct.minDollarValue;
        oThis.productDollarStep = redemptionProduct.dollarStep;
      }
    }

    if (!validationResult) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_ir_5',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_product_id'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Validate dollar amount.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateDollarAmount() {
    const oThis = this;

    logger.log('oThis.dollarAmount =========', oThis.dollarAmount);
    logger.log('oThis.productMinDollarValue ======', oThis.productMinDollarValue);

    if (oThis.dollarAmount < oThis.productMinDollarValue) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_ir_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_dollar_amount'],
          debug_options: {
            dollarAmount: oThis.dollarAmount,
            dollarValue: oThis.productMinDollarValue
          }
        })
      );
    }

    logger.log('oThis.dollarAmount % oThis.productDollarStep ======', oThis.dollarAmount % oThis.productDollarStep);

    if (oThis.dollarAmount % oThis.productDollarStep !== 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_ir_4',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_dollar_amount'],
          debug_options: {
            dollarAmount: oThis.dollarAmount,
            dollarStep: oThis.productDollarStep
          }
        })
      );
    }
  }

  /**
   * Get pepocorn amount.
   *
   * @private
   */
  _getPepocornAmount() {
    const oThis = this;

    const noOfDollarSteps = oThis.dollarAmount / oThis.productDollarStep,
      pepocornPerDollarStep = redemptionConstants.pepocornPerDollarStep;

    console.log('oThis.noOfDollarSteps ====', noOfDollarSteps);
    console.log('pepocornPerDollarStep ====', pepocornPerDollarStep);

    oThis.pepocornAmount = noOfDollarSteps * pepocornPerDollarStep;

    console.log('oThis.pepocornAmount ====', oThis.pepocornAmount);
  }

  /**
   * Get pepocorn balance.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validatePepocornBalance() {
    const oThis = this,
      pepoCornBalanceResponse = await new GetPepocornBalance({ userIds: [oThis.currentUserId] }).perform();

    const pepocornBalance = pepoCornBalanceResponse[oThis.currentUserId].balance;

    console.log('pepocornBalance ====', pepocornBalance);

    if (oThis.pepocornAmount < pepocornBalance) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_r_ir_4',
          api_error_identifier: 'invalid_api_params',
          debug_options: {
            pepocornAmount: oThis.pepocornAmount,
            pepocornBalance: pepocornBalance
          }
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
   * Debit pepocorn balance.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _debitPepocornBalance() {
    const oThis = this;

    await new PepocornBalanceModel({})
      .update([
        'balance = CASE WHEN balance - ? > 0 THEN balance - ? ELSE balance END',
        oThis.pepocornAmount,
        oThis.pepocornAmount
      ])
      .where({ user_id: oThis.currentUserId })
      .fire();

    // Flush Cache.
    await PepocornBalanceModel.flushCache({ userId: oThis.currentUserId });
  }

  /**
   * Insert into pepocorn transactions.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertPepocornTransactions() {
    const oThis = this;

    await new PepocornTransactionsModel({})
      .insert({
        user_id: oThis.currentUserId,
        kind: pepocornTransactionConstants.invertedKinds[pepocornTransactionConstants.debitKind],
        pepocorn_amount: oThis.pepocornAmount,
        redemption_id: oThis.redemptionId,
        status: pepocornTransactionConstants.invertedStatuses[pepocornTransactionConstants.processingStatus]
      })
      .fire();
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
        product_dollar_value: oThis.productDollarValue,
        // Redemption details.
        redemption_id: oThis.redemptionId,
        dollar_amount: oThis.dollarAmount,
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

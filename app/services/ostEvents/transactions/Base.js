const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  PendingTransactionModel = require(rootPrefix + '/app/models/mysql/PendingTransaction'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  PepocornTransactionModel = require(rootPrefix + '/app/models/mysql/PepocornTransaction'),
  TokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TransactionByOstTxIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByOstTxId'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  ValidatePepocornTopUp = require(rootPrefix + '/app/services/pepocornTopUp/Validate'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  pepocornTransactionConstants = require(rootPrefix + '/lib/globalConstant/redemption/pepocornTransaction'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for transaction event ost base.
 *
 * @class TransactionOstEventBase
 */
class TransactionOstEventBase extends ServiceBase {
  /**
   * Constructor for transaction event ost base.
   *
   * @param {object} params
   * @param {string} params.data: contains the webhook event data
   * @param {string} params.data.transaction: Transaction entity result from ost
   * @param {string} params.data.transaction.id
   * @param {string} params.data.transaction.status
   * @param {string} [params.data.transaction.block_timestamp]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.ostTransaction = params.data.transaction;

    oThis.ostTxId = oThis.ostTransaction.id;
    oThis.ostTransactionStatus = oThis.ostTransaction.status;
    oThis.ostTransactionMinedTimestamp = oThis.ostTransaction.block_timestamp || null;

    oThis.toUserId = null;
    oThis.fromUserId = null;
    oThis.transactionObj = null;

    oThis.videoId = null;

    oThis.pepocornAmount = null;
    oThis.productId = null;
    oThis.pepoUsdPricePoint = null;
    oThis.isValidRedemption = null;

    oThis._parseMetaAndSetData();
  }

  /**
   * Parses details in meta property and prepares a hash out of it.
   * Note: It is expected that all key value pairs in details string will be separated by space. Key and value themselves are separated by '_'
   * Eg string: 'key1_val1 key2_val2'
   *
   * @returns {{}}
   * @private
   */
  _parseTransactionMeta() {
    const oThis = this;

    return transactionConstants._parseTransactionMetaDetails(oThis.ostTransaction.meta_property);
  }

  /**
   * Sets video id if video was associated with the transaction.
   *
   * @private
   */
  _parseMetaAndSetData() {
    const oThis = this;

    const parsedHash = oThis._parseTransactionMeta();

    logger.log('parsedHash =======', parsedHash);

    if (oThis._isRedemptionTransactionKind()) {
      oThis.pepocornAmount = parsedHash.pepocornAmount;
      oThis.productId = parsedHash.productId;
      oThis.pepoUsdPricePoint = parsedHash.pepoUsdPricePoint;
    } else {
      if (parsedHash.videoId) {
        oThis.videoId = parsedHash.videoId;
      }

      if (parsedHash.isPaperPlane == 1) {
        oThis.isPaperPlane = true;
      }
    }
  }

  /**
   * Validate transaction object.
   *
   * @returns {Promise<*>}
   */
  async validateTransactionObj() {
    const oThis = this;

    if (!oThis.transactionObj) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_oe_t_f_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { reason: 'Transaction obj was empty' }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    if (oThis.transactionObj.status !== transactionConstants.pendingStatus) {
      const errorObject1 = responseHelper.error({
        internal_error_identifier: 'a_s_oe_t_f_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { reason: 'Transaction status is not pending.' }
      });
      await createErrorLogsEntry.perform(errorObject1, errorLogsConstants.mediumSeverity);

      return Promise.reject(errorObject1);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    throw new Error('Unimplemented method _asyncPerform for TransactionOstEvent.');
  }

  /**
   * Validate request.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Start:: Validate for Transaction Webhook');
    const paramErrors = [];

    if (oThis.ostTransactionStatus !== oThis._validTransactionStatus()) {
      paramErrors.push('invalid_status');
    }

    if (paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_oe_t_b_vas_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          debug_options: {}
        })
      );
    }

    logger.log('End:: Validate for Transaction Webhook');
  }

  /**
   * Get transaction.
   *
   * @returns {Promise<void>}
   */
  async fetchTransaction() {
    const oThis = this;

    logger.log('Start:: Fetch transaction from transaction table');

    const transactionCacheResponse = await new TransactionByOstTxIdCache({ ostTxIds: [oThis.ostTxId] }).fetch();

    if (transactionCacheResponse.isFailure()) {
      return Promise.reject(transactionCacheResponse);
    }

    if (transactionCacheResponse.data[oThis.ostTxId].id) {
      oThis.transactionObj = transactionCacheResponse.data[oThis.ostTxId];
    }
  }

  /**
   * This function gives user id for the given ost user id(uuid).
   *
   * @param {array} ostUserIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUserIdFromOstUserIds(ostUserIds) {
    const tokenUserRsp = await new TokenUserByOstUserIdsCache({ ostUserIds: ostUserIds }).fetch();

    if (tokenUserRsp.isFailure()) {
      return Promise.reject(tokenUserRsp);
    }

    const ostUserIdToUserIdHash = {};

    for (let index = 0; index < ostUserIds.length; index++) {
      const ostUserId = ostUserIds[index];
      ostUserIdToUserIdHash[ostUserId] = tokenUserRsp.data[ostUserId].userId;
    }

    return ostUserIdToUserIdHash;
  }

  /**
   * Set from and to user ids.
   *
   * @sets oThis.fromUserId, oThis.toUserId
   *
   * @returns {Promise<void>}
   */
  async setFromAndToUserId() {
    const oThis = this;

    const fromOstUserId = oThis.ostTransaction.transfers[0].from_user_id,
      toOstUserId = oThis.ostTransaction.transfers[0].to_user_id,
      ostUserIdToUserIdHash = await oThis._getUserIdFromOstUserIds([fromOstUserId, toOstUserId]);

    oThis.fromUserId = ostUserIdToUserIdHash[fromOstUserId];
    oThis.toUserId = ostUserIdToUserIdHash[toOstUserId];
  }

  /**
   * Validate to user id.
   *
   * @returns {Promise<never>}
   */
  async validateToUserId() {
    const oThis = this;

    if (oThis.toUserId !== oThis.transactionObj.extraData.toUserIds[0]) {
      logger.error('Mismatch in to user id in table and in webhook data.');

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_oe_t_b_9',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_to_user_id'],
          debug_options: { transaction: oThis.transactionObj }
        })
      );
    }
  }

  /**
   * Validate transfers.
   *
   * @returns {Promise<void>}
   */
  async validateTransfers() {
    const oThis = this;

    const paramErrors = [];

    logger.log('Validate transfers');

    if (oThis.ostTransaction.transfers.length !== 1) {
      paramErrors.push('invalid_transfers');
    }

    // From user id will be same for all transfers in a transaction.
    if (oThis.fromUserId !== oThis.transactionObj.fromUserId) {
      logger.error('Mismatch in from user id in table and in webhook data.');
      paramErrors.push('invalid_from_user_id');
    }

    //Note UserId is 0 for comapny token holder address
    if ((oThis.toUserId || 0) !== oThis.transactionObj.extraData.toUserIds[0]) {
      logger.error('Mismatch in to user id in table and in webhook data.');
      paramErrors.push('invalid_to_user_id');
    }

    if (paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_oe_t_b_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          debug_options: { transaction: oThis.transactionObj }
        })
      );
    }
  }

  /**
   * Update ost transaction status in transaction table.
   *
   *
   * @returns {Promise<void>}
   */
  async updateTransaction() {
    const oThis = this;
    logger.log('Start:: Update transaction table for Transaction Webhook');

    const status = oThis._transactionStatus();

    await new TransactionModel()
      .update({
        status: transactionConstants.invertedStatuses[status]
      })
      .where(['id = ?', oThis.transactionObj.id])
      .fire();

    oThis.transactionObj.status = status;

    await TransactionModel.flushCache(oThis.transactionObj);

    logger.log('End:: Update transaction table for Transaction Webhook');
  }

  /**
   * Remove entry from pending transactions.
   *
   * @returns {Promise<void>}
   */
  async removeEntryFromPendingTransactions() {
    const oThis = this;
    logger.log('Start:: Remove entry from pending transaction');

    await new PendingTransactionModel()
      .delete()
      .where({ ost_tx_id: oThis.ostTxId })
      .fire();

    const pendingTransactionObj = {
      ostTxid: oThis.ostTxId,
      fromUserId: oThis.fromUserId,
      videoId: oThis.videoId,
      toUserId: oThis.transactionObj.extraData.toUserIds[0]
    };

    await PendingTransactionModel.flushCache(pendingTransactionObj);

    logger.log('End:: Remove entry from pending transaction');
  }

  /**
   * Mark airdrop failed property for token user.
   *
   * @returns {Promise<void>}
   */
  async processForAirdropTransaction() {
    const oThis = this;
    logger.log('Start:: Update token user to mark airdrops status');

    const tokenUserObjRes = await new TokenUserByUserIdCache({
      userIds: [oThis.toUserId]
    }).fetch();

    if (tokenUserObjRes.isFailure()) {
      return Promise.reject(tokenUserObjRes);
    }

    if (!tokenUserObjRes.data[oThis.toUserId].id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_b_4',
          api_error_identifier: 'resource_not_found'
        })
      );
    }

    const tokenUserObj = tokenUserObjRes.data[oThis.toUserId],
      propertyVal = oThis._getPropertyValForTokenUser(tokenUserObj.properties);

    await new TokenUserModel()
      .update({
        properties: propertyVal
      })
      .where(['id = ?', tokenUserObj.id])
      .fire();

    tokenUserObj.properties = propertyVal;

    await TokenUserModel.flushCache(tokenUserObj);
    logger.log('End:: Update token user to mark airdrops status');
  }

  async processForTopUpTransaction() {
    const oThis = this;

    await new FiatPaymentModel()
      .update({
        status: oThis._getPaymentStatus()
      })
      .where({ id: oThis.transactionObj.fiatPaymentId })
      .fire();

    return responseHelper.successWithData({});
  }

  async updatePepocornTransactionModel() {
    const oThis = this;

    await new PepocornTransactionModel()
      .update({
        status: pepocornTransactionConstants.invertedStatuses[oThis._getPepocornTransactionStatus()]
      })
      .where({ transaction_id: oThis.transactionObj.id })
      .fire();

    await PepocornTransactionModel.flushCache({
      transactionId: oThis.transactionObj.id
    });

    return responseHelper.successWithData({});
  }

  /**
   * Insert in Pepocorn transaction table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInPepocornTransactions() {
    const oThis = this;

    const status = oThis._getPepocornTransactionStatus();

    const insertData = {
      user_id: oThis.fromUserId,
      kind: pepocornTransactionConstants.invertedKinds[pepocornTransactionConstants.creditKind],
      pepocorn_amount: oThis.pepocornAmount,
      transaction_id: oThis.transactionObj.id,
      status: pepocornTransactionConstants.invertedStatuses[status]
    };

    const insertResponse = await new PepocornTransactionModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;

    const formattedInsertData = new PepocornTransactionModel().formatDbData(insertData);
    await PepocornTransactionModel.flushCache(formattedInsertData);
  }

  /**
   * Insert in transaction table.
   *
   * @sets oThis.transactionObj
   *
   * @returns {Promise<{isDuplicateIndexViolation: boolean}>}
   */
  async insertInTransaction() {
    const oThis = this;

    if (
      (oThis._isRedemptionTransactionKind() && !oThis.fromUserId) ||
      (!oThis._isRedemptionTransactionKind() && (!oThis.toUserId || !oThis.fromUserId))
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_b_8',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            Reason: 'Invalid from user id or to user id.',
            fromUserId: oThis.fromUserId,
            toUserId: oThis.toUserId,
            ostTxId: oThis.ostTxId
          }
        })
      );
    }

    let isDuplicateIndexViolation = false;

    let txKind = null;

    if (oThis._isRedemptionTransactionKind()) {
      txKind = transactionConstants.extraData.redemptionKind;
    } else {
      txKind = transactionConstants.extraData.userTransactionKind;
    }

    const extraData = {
      toUserIds: [oThis.toUserId],
      amounts: [oThis.ostTransaction.transfers[0].amount],
      kind: txKind
    };

    const insertData = {
      ost_tx_id: oThis.ostTxId,
      from_user_id: oThis.fromUserId,
      video_id: oThis.videoId,
      extra_data: JSON.stringify(extraData),
      text_id: null,
      status: transactionConstants.invertedStatuses[oThis._transactionStatus()]
    };

    const insertResponse = await new TransactionModel()
      .insert(insertData)
      .fire()
      .catch(async function(err) {
        if (TransactionModel.isDuplicateIndexViolation(TransactionModel.transactionIdUniqueIndexName, err)) {
          isDuplicateIndexViolation = true;
        } else {
          // Insert failed due to some other reason.
          // Send error email from here.
          const errorObject = responseHelper.error({
            internal_error_identifier: 'a_s_oe_t_b_5',
            api_error_identifier: 'something_went_wrong',
            debug_options: { Error: err }
          });
          await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

          return Promise.reject(errorObject);
        }
      });

    if (!isDuplicateIndexViolation) {
      insertData.id = insertResponse.insertId;

      const formattedInsertData = new TransactionModel().formatDbData(insertData);
      await TransactionModel.flushCache(formattedInsertData);

      oThis.transactionObj = formattedInsertData;
    }

    return { isDuplicateIndexViolation: isDuplicateIndexViolation };
  }

  /**
   * Fetch video and validate.
   *
   * @returns {Promise<never>}
   */
  async fetchVideoAndValidate() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    const videoIdFromCache = videoDetailsCacheResponse.data[oThis.videoId].videoId;

    if (+videoIdFromCache !== +oThis.videoId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_oe_t_b_7',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoIdFromCache: videoIdFromCache, videoId: oThis.videoId }
        })
      );
    }
  }

  /**
   * Enqueue user notification.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueUserNotification(topic) {
    const oThis = this;
    // Notification would be published only if user is approved.
    await notificationJobEnqueue.enqueue(topic, { transaction: oThis.transactionObj });
  }

  /**
   * This function check if video is present in parameters.
   *
   * @returns {boolean}
   */
  isVideoIdPresent() {
    const oThis = this;

    return !commonValidator.isVarNullOrUndefined(oThis.videoId);
  }

  /**
   * Current timestamp in seconds.
   *
   * @return {Integer}
   * @private
   */
  _publishedTimestamp() {
    return Math.round(new Date() / 1000);
  }

  /**
   * Valid transaction status.
   *
   * @return {String}
   * @private
   */
  _validTransactionStatus() {
    throw new Error('Unimplemented method validTransactionStatus for TransactionOstEvent.');
  }

  /**
   * Transaction status
   *
   * @private
   */
  _transactionStatus() {
    throw new Error('Unimplemented method _transactionStatus for TransactionOstEvent.');
  }

  /**
   * Get new property value for token user.
   *
   * @private
   */
  _getPropertyValForTokenUser() {
    throw new Error('Unimplemented method getPropertyValForTokenUser for TransactionOstEvent.');
  }

  _getPepocornTransactionStatus() {
    throw new Error('Unimplemented method _getPepocornTransactionStatus for TransactionOstEvent.');
  }

  /**
   * This function validates if the parameters are correct.
   *
   * @sets oThis.isValidRedemption
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateTransactionDataForRedemption() {
    const oThis = this;

    // Note: Use params from ost event for validation.
    const validateParams = {
      request_timestamp: oThis.ostTransaction.block_timestamp,
      product_id: oThis.productId,
      pepo_amount_in_wei: oThis.ostTransaction.transfers[0].amount,
      pepocorn_amount: oThis.pepocornAmount,
      pepo_usd_price_point: oThis.pepoUsdPricePoint
    };

    oThis.isValidRedemption = false;

    const pepocornTopUpValidationResponse = await new ValidatePepocornTopUp(validateParams)
      .perform()
      .catch(async function(err) {
        await createErrorLogsEntry.perform(err, errorLogsConstants.highSeverity);
      });

    if (pepocornTopUpValidationResponse.isFailure()) {
      await createErrorLogsEntry.perform(pepocornTopUpValidationResponse, errorLogsConstants.highSeverity);
    } else {
      oThis.isValidRedemption = true;
    }
  }

  /**
   * This function validates to user ids and inserts in to user ids array. It also prepares amounts array.
   *
   * @sets oThis.toUserIdsArray, oThis.amountsArray
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateToUserIdForRedemption() {
    const oThis = this;

    if (oThis.ostTransaction.transfers.length !== 1) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_oe_b_vtui_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { transfersData: oThis.ostTransaction.transfers }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    const tokenDataRsp = await new SecureTokenCache().fetch();
    if (tokenDataRsp.isFailure()) {
      logger.error('Error while fetching token data.');

      return Promise.reject(tokenDataRsp);
    }

    const tokenData = tokenDataRsp.data;

    if (oThis.ostTransaction.transfers[0].to_user_id.toLowerCase() !== tokenData.ostCompanyUserId.toLowerCase()) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_oe_b_vtui_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { transfersData: oThis.ostTransaction.transfers }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }
  }

  /**
   * Return true if it is a pepocorn convert for redemption transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isRedemptionTransactionKind() {
    const oThis = this;

    return oThis.ostTransaction.meta_property.name === transactionConstants.redemptionMetaName;
  }

  /**
   * Return true if it is reply on video transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isReplyOnVideoTransactionKind() {
    const oThis = this;

    return oThis.transaction.meta_property.name === transactionConstants.replyOnVideoMetaName;
  }

  /**
   * Return true if it is user-to-user transaction on a reply video.
   *
   * @returns {boolean}
   * @private
   */
  _isPepoOnReplyTransactionKind() {
    const oThis = this;

    return oThis.transaction.meta_property.name === transactionConstants.pepoOnReplyMetaName;
  }
}

module.exports = TransactionOstEventBase;

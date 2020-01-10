const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  PendingTransactionModel = require(rootPrefix + '/app/models/mysql/PendingTransaction'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  PepocornTransactionModel = require(rootPrefix + '/app/models/mysql/PepocornTransaction'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  ReplyDetailsByEntityIdsAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/multi/ReplyDetailsByEntityIdsAndEntityKind'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
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
 * Class for transaction kind base.
 *
 * @class TransactionOstEventBase
 */
class TransactionWebhookBase extends ServiceBase {
  /**
   * Constructor for transaction kind base.
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

    oThis.ostTransaction = params.transaction;

    oThis.ostTxId = oThis.ostTransaction.id;
    oThis.ostTransactionStatus = oThis.ostTransaction.status;
    oThis.ostTransactionMinedTimestamp = oThis.ostTransaction.block_timestamp || null;

    oThis.toUserId = null;
    oThis.fromUserId = null;
    oThis.transactionObj = null;

    oThis.videoId = null;
    oThis.parentVideoId = null;
    oThis.replyDetailId = null;
    oThis.parentVideoId = null;

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
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      oThis.replyDetailId = parsedHash.replyDetailId;
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      oThis.replyDetailId = parsedHash.replyDetailId;
      oThis.videoId = parsedHash.videoId;
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
        internal_error_identifier: 'a_s_oe_t_b_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { reason: 'Transaction obj was empty' }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    }

    if (oThis.transactionObj.status !== transactionConstants.pendingStatus) {
      const errorObject1 = responseHelper.error({
        internal_error_identifier: 'a_s_oe_t_b_2',
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

    if (oThis.toUserId !== oThis.transactionObj.toUserId) {
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
    if ((oThis.toUserId || '0') !== oThis.transactionObj.toUserId) {
      logger.error('Mismatch in to user id in table and in webhook data.');
      paramErrors.push('invalid_to_user_id');
    }

    if (paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_oe_t_b_10',
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
      toUserId: oThis.transactionObj.toUserId
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

  /**
   * Process for topup transaction
   *
   * @returns {Promise<*|result>}
   */
  async processForTopUpTransaction() {
    const oThis = this;

    await new FiatPaymentModel()
      .update({
        status: oThis._getPaymentStatus()
      })
      .where({ id: oThis.transactionObj.extraData.fiatPaymentId })
      .fire();

    return responseHelper.successWithData({});
  }

  /**
   * Update pepocorn transaction model
   *
   * @returns {Promise<*|result>}
   */
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

    const extraData = {};

    let isDuplicateIndexViolation = false;

    let txKind = null;

    //video_id is parent video id for reply on video.
    //no video id in pepo on reply so we fetch the entity id using reply detail id.

    if (oThis._isRedemptionTransactionKind()) {
      txKind = transactionConstants.redemptionKind;
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      txKind = transactionConstants.userTransactionOnReplyKind;
      extraData['replyDetailId'] = oThis.replyDetailId;
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      txKind = transactionConstants.replyOnVideoTransactionKind;
      extraData['replyDetailId'] = oThis.replyDetailId;
    } else {
      txKind = transactionConstants.userTransactionKind;
    }

    const insertData = {
      ost_tx_id: oThis.ostTxId,
      from_user_id: oThis.fromUserId,
      kind: transactionConstants.invertedKinds[txKind],
      to_user_id: oThis.toUserId,
      amount: oThis.ostTransaction.transfers[0].amount,
      extra_data: JSON.stringify(extraData),
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

    if (oThis.replyDetailId) {
      const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();
      if (replyDetailCacheResp.isFailure()) {
        logger.error('Error while fetching reply detail data.');

        return Promise.reject(replyDetailCacheResp);
      }

      const replyDetail = replyDetailCacheResp.data[oThis.replyDetailId];

      if (!CommonValidators.validateNonEmptyObject(replyDetail)) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_oe_t_b_6',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['invalid_reply_detail_id'],
            debug_options: { replyDetail: replyDetail, replyDetailId: oThis.replyDetailId }
          })
        );
      }
    } else {
      const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
      if (videoDetailsCacheResponse.isFailure()) {
        logger.error('Error while fetching video detail data.');
        return Promise.reject(videoDetailsCacheResponse);
      }
      //todo-replies: use different method to validate reply video

      let videoDetail = videoDetailsCacheResponse.data[oThis.videoId];

      // Note: For older build if we receive pepo_on_reply for this this condition is added.
      if (CommonValidators.validateNonEmptyObject(videoDetail)) {
        return responseHelper.successWithData({});
      } else {
        const replyDetailsByEntityIdsAndEntityKindCacheRsp = await new ReplyDetailsByEntityIdsAndEntityKindCache({
          entityIds: [oThis.videoId],
          entityKind: replyDetailConstants.videoEntityKind
        }).fetch();

        if (replyDetailsByEntityIdsAndEntityKindCacheRsp.isFailure()) {
          logger.error('Error while fetching reply detail data.');

          return Promise.reject(replyDetailsByEntityIdsAndEntityKindCacheRsp);
        }

        const replyDetailId = replyDetailsByEntityIdsAndEntityKindCacheRsp.data[oThis.videoId].id;

        if (!replyDetailId) {
          return Promise.reject(
            responseHelper.paramValidationError({
              internal_error_identifier: 'a_s_oe_t_b_11',
              api_error_identifier: 'invalid_api_params',
              params_error_identifiers: ['invalid_video_id'],
              debug_options: { videoDetail: videoDetail, replyDetailId: replyDetailId }
            })
          );
        }
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch reply details and validate.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchReplyDetailsAndValidate() {
    const oThis = this;

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();
    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailCacheResp);
    }

    let replyDetail = replyDetailCacheResp.data[oThis.replyDetailId];

    if (!CommonValidators.validateNonEmptyObject(replyDetail)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_oe_t_b_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_reply_detail_id'],
          debug_options: { replyDetail: replyDetail, replyDetailId: oThis.replyDetailId }
        })
      );
    }

    oThis.parentVideoId = replyDetail.parentId;

    if (oThis._isPepoOnReplyTransactionKind()) {
      oThis.videoId = replyDetail.entityId;
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
   * This function check if reply detail is present in parameters.
   *
   * @returns {boolean}
   */
  isReplyDetailIdPresent() {
    const oThis = this;

    return !commonValidator.isVarNullOrUndefined(oThis.replyDetailId);
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
  _isUserActivateAirdropTransactionKind() {
    const oThis = this;

    return oThis.ostTransaction.meta_property.name === transactionConstants.userActivateAirdropMetaName;
  }

  /**
   * Return true if it is a pepocorn convert for redemption transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isTopUpTransactionKind() {
    const oThis = this;

    return oThis.ostTransaction.meta_property.name === transactionConstants.topUpMetaName;
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

    return oThis.ostTransaction.meta_property.name === transactionConstants.replyOnVideoMetaName;
  }

  /**
   * Return true if it is user-to-user transaction on a reply video.
   *
   * @returns {boolean}
   * @private
   */
  _isPepoOnReplyTransactionKind() {
    const oThis = this;

    return oThis.ostTransaction.meta_property.name === transactionConstants.pepoOnReplyMetaName;
  }

  /**
   * Return true if it is a pepocorn convert for redemption transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isUserTransactionKind() {
    const oThis = this;

    return (
      !oThis._isUserActivateAirdropTransactionKind() &&
      !oThis._isTopUpTransactionKind() &&
      !oThis._isRedemptionTransactionKind() &&
      !oThis._isReplyOnVideoTransactionKind() &&
      !oThis._isPepoOnReplyTransactionKind()
    );
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

  /**
   * Get pepocorn transaction status.
   *
   * @private
   */
  _getPepocornTransactionStatus() {
    throw new Error('Unimplemented method _getPepocornTransactionStatus for TransactionOstEvent.');
  }
}

module.exports = TransactionWebhookBase;

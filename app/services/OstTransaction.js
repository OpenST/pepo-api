const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  ExternalEntityModel = require(rootPrefix + '/app/models/mysql/ExternalEntity'),
  PendingTransactionModel = require(rootPrefix + '/app/models/mysql/PendingTransaction'),
  TokenUserByUserId = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TransactionByOstTxIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByOstTxId'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  ExternalEntitiesByEntityIdAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/single/ExternalEntitiyByEntityIdAndEntityKind'),
  UserDeviceIdsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

class OstTransaction extends ServiceBase {
  /**
   * @param {object} params
   * @param {object} params.ost_transaction
   * @param {object} params.current_user
   * @param {object} [params.is_paper_plane]
   * @param {object} [params.meta]
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.transaction = params.ost_transaction;
    oThis.userId = params.current_user.id;
    oThis.isPaperPlane = params.is_paper_plane;

    params.meta = params.meta || {};

    oThis.giphyObject = params.meta.giphy;
    oThis.text = params.meta.text;
    oThis.videoId = params.meta.vi;

    oThis.ostTxId = oThis.transaction.id;
    oThis.ostTransactionStatus = oThis.transaction.status.toUpperCase();
    oThis.transfersData = oThis.transaction.transfers;
    oThis.fromOstUserId = oThis.transfersData[0].from_user_id;
    oThis.toOstUserId = oThis.transfersData[0].to_user_id;

    oThis.textId = null;
    oThis.transactionId = null;
    oThis.transactionObj = null;
    oThis.transactionStatus = null;
    oThis.giphyExternalEntityId = null;
    oThis.ostTxExternalEntityId = null;
    oThis.transactionExternalEntityId = null;
    oThis.toUserIdsArray = [];
    oThis.amountsArray = [];
  }

  /**
   * AsyncPerform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    logger.log('oThis.transaction =====', oThis.transaction);

    oThis._validateAndSanitizeParams();

    const setStatusResponse = await oThis._setStatuses();
    if (setStatusResponse.isFailure()) {
      return Promise.reject(setStatusResponse);
    }

    const promiseArray1 = [];
    promiseArray1.push(oThis._fetchGiphyExternalEntityId());
    promiseArray1.push(oThis._fetchTransaction());
    promiseArray1.push(oThis._fetchOstUserIdAndValidate());

    await Promise.all(promiseArray1);

    if (oThis.transactionId) {
      await oThis._updateTransaction();
    } else {
      await oThis._insertInTransactionAndAssociatedTables();
    }

    if (oThis.isPaperPlane) {
      await oThis._getUserIdFromOstUserIds();

      await oThis._checkIfPushNotificationRequired();
    }

    return Promise.resolve(responseHelper.successWithData());
  }

  /**
   * Validate and sanitize
   *
   * @private
   */
  _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.text) {
      oThis.text = CommonValidators.sanitizeText(oThis.text);
    }
  }

  /**
   * This function will be called only when transaction already exists in the table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTransaction() {
    const oThis = this;
    const promiseArray = [];

    // If table row has giphy or text id; return.
    if (oThis.transactionObj.giphyId || oThis.transactionObj.textId) {
      return;
    }

    // If input param has giphy or text; update with insert text.
    if (oThis._isGiphyPresent() && !oThis.giphyExternalEntityId) {
      promiseArray.push(oThis._insertGiphyInExternalEntities());
    }
    if (oThis._isTextPresent()) {
      promiseArray.push(oThis._insertText());
    }

    await Promise.all(promiseArray);

    const updateData = {};
    if (oThis._isGiphyPresent()) {
      updateData.giphy_id = oThis.giphyExternalEntityId;
    }
    if (oThis._isTextPresent()) {
      updateData.text_id = oThis.textId;
    }

    if (Object.keys(updateData).length !== 0) {
      await oThis._updateGiphyAndTextInTransaction(updateData);
    }
  }

  /**
   * This function is called when transaction is not found in transaction table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInTransactionAndAssociatedTables() {
    const oThis = this;

    // Insert in external entities, transactions and pending transactions.
    await oThis._insertGiphyTextAndTransaction();

    const insertTransactionResponse = await oThis._insertTransaction();
    if (insertTransactionResponse.isDuplicateIndexViolation) {
      await oThis._fetchTransaction();
      if (!oThis.transactionId) {
        const errorObject = responseHelper.error({
          internal_error_identifier: 'a_s_ost_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { ostTxId: oThis.ostTxId }
        });
        createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

        return Promise.reject(errorObject);
      }

      await oThis._updateTransaction();
    } else {
      const promiseArray2 = [];

      promiseArray2.push(oThis._insertInPendingTransactions());

      await Promise.all(promiseArray2);
    }
  }

  /**
   * This function gives user id for the given ost user id(uuid).
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getUserIdFromOstUserIds() {
    const oThis = this;

    const tokenUserRsp = await new TokenUserByOstUserIdsCache({
      ostUserIds: [oThis.fromOstUserId, oThis.toOstUserId]
    }).fetch();

    if (tokenUserRsp.isFailure()) {
      return Promise.reject(tokenUserRsp);
    }

    oThis.fromUserId = tokenUserRsp.data[oThis.fromOstUserId].userId;
    oThis.toUserId = tokenUserRsp.data[oThis.toOstUserId].userId;
  }

  /**
   * This function checks if push notification is required.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkIfPushNotificationRequired() {
    const oThis = this;

    const userDeviceCacheRsp = await new UserDeviceIdsByUserIdsCache({ userIds: [oThis.toUserId] }).fetch();

    if (userDeviceCacheRsp.isFailure()) {
      return Promise.reject(userDeviceCacheRsp);
    }

    const userDeviceIds = userDeviceCacheRsp.data[oThis.toUserId];

    if (Array.isArray(userDeviceIds) && userDeviceIds.length > 0) {
      await oThis._enqueueUserNotification();
    }
  }

  /**
   * Enqueue user notification.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueUserNotification() {
    const oThis = this;
    // Notification would be published only if user is approved.
    await notificationJobEnqueue.enqueue(notificationJobConstants.paperPlaneTransaction, {
      transaction: oThis.transactionObj
    });
  }

  /**
   * Set statuses.
   *
   * @private
   */
  async _setStatuses() {
    const oThis = this;

    if (transactionConstants.notFinalizedOstTransactionStatuses.indexOf(oThis.ostTransactionStatus) > -1) {
      oThis.transactionStatus = transactionConstants.pendingStatus;
    } else {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_ost_4',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          Error: 'Invalid ost transaction status. Only allowed ost status is CREATED ',
          ostTransactionStatus: oThis.ostTransactionStatus
        }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return errorObject;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch giphy external entity id from db.
   *
   * @returns {Boolean}
   * @private
   */
  async _fetchGiphyExternalEntityId() {
    const oThis = this;

    if (oThis._isGiphyPresent()) {
      const paramsForGiphy = {
          entityId: oThis.giphyObject.id,
          entityKind: externalEntityConstants.giphyEntityKind
        },
        cacheResponseForGiphy = await new ExternalEntitiesByEntityIdAndEntityKindCache(paramsForGiphy).fetch();

      if (cacheResponseForGiphy.isFailure()) {
        return Promise.reject(cacheResponseForGiphy);
      }

      if (cacheResponseForGiphy.data.id) {
        oThis.giphyExternalEntityId = cacheResponseForGiphy.data.id;
      }
    }
  }

  /**
   * Insert text
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertText() {
    const oThis = this;

    const insertData = {
        text: oThis.text
      },
      insertResponse = await new TextModel().insertText(insertData);

    oThis.textId = insertResponse.insertId;
    insertData.id = insertResponse.insertId;

    const formattedInsertData = new TextModel().formatDbData(insertData);
    await TextModel.flushCache(formattedInsertData);
  }

  /**
   * Fetch transaction from db.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTransaction() {
    const oThis = this;

    const transactionCacheResponse = await new TransactionByOstTxIdCache({ ostTxIds: [oThis.ostTxId] }).fetch();

    logger.log('transactionCacheResponse =======', transactionCacheResponse);
    if (transactionCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ost_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            reason: 'Error while fetching data from TransactionByOstTxIdCache',
            ostTxIds: oThis.ostTxId
          }
        })
      );
    }

    if (transactionCacheResponse.data[oThis.ostTxId].id) {
      oThis.transactionId = transactionCacheResponse.data[oThis.ostTxId].id;
      oThis.transactionObj = transactionCacheResponse.data[oThis.ostTxId];
    }

    logger.log('oThis.transactionObj =======', oThis.transactionObj);
  }

  /**
   * This function check if the giphy is present or not
   *
   * @returns {boolean}
   * @private
   */
  _isGiphyPresent() {
    const oThis = this;

    return !CommonValidators.isVarNullOrUndefined(oThis.giphyObject);
  }

  /**
   * This function checks if string is non empty
   *
   * @returns {boolean}
   * @private
   */
  _isTextPresent() {
    const oThis = this;

    return CommonValidators.validateNonBlankString(oThis.text);
  }

  /**
   * This function check if video is present in parameters
   *
   * @returns {boolean}
   * @private
   */
  _isVideoIdPresent() {
    const oThis = this;

    return !CommonValidators.isVarNullOrUndefined(oThis.videoId);
  }

  /**
   * Fetch OST user id
   *
   * @private
   */
  async _fetchOstUserIdAndValidate() {
    const oThis = this;

    const userIds = [oThis.userId];

    const tokenUserDetailsResponse = await new TokenUserByUserId({ userIds: userIds }).fetch();

    if (tokenUserDetailsResponse.isFailure()) {
      return Promise.reject(tokenUserDetailsResponse);
    }

    const userIdToOstUserIdHash = {};
    for (let index = 0; index < userIds.length; index++) {
      const userId = userIds[index];
      // Returning only those entries ost user ids whose data is available
      if (tokenUserDetailsResponse.data[userId].ostUserId) {
        userIdToOstUserIdHash[userId] = tokenUserDetailsResponse.data[userId].ostUserId;
      }
    }

    oThis.ostUserId = userIdToOstUserIdHash[oThis.userId];

    if (!oThis.ostUserId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ot_5',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: oThis.userId }
        })
      );
    }

    if (oThis.ostUserId !== oThis.fromOstUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_ot_6',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_from_user_id'],
          debug_options: { transfers: oThis.transfersData }
        })
      );
    }
  }

  /**
   * Update giphy and text in transaction table
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateGiphyAndTextInTransaction(updateData) {
    const oThis = this;

    await new TransactionModel()
      .update(updateData)
      .where({ id: oThis.transactionObj.id })
      .fire();

    const transactionObj = oThis.transactionObj;
    transactionObj.textId = oThis.textId;
    transactionObj.giphyId = oThis.giphyExternalEntityId;

    await TransactionModel.flushCache(transactionObj);
  }

  /**
   * Fetch video details and validate
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoDetailsAndValidate() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    const videoIdFromCache = videoDetailsCacheResponse.data[oThis.videoId].videoId;

    if (videoIdFromCache != oThis.videoId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_ot_7',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoIdFromCache: videoIdFromCache, videoId: oThis.videoId }
        })
      );
    }
  }

  /**
   * This function inserts data in external entities table
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertGiphyTextAndTransaction() {
    const oThis = this;

    const promiseArray = [];

    if (oThis._isGiphyPresent() && !oThis.giphyExternalEntityId) {
      promiseArray.push(oThis._insertGiphyInExternalEntities());
    }

    if (oThis._isTextPresent()) {
      promiseArray.push(oThis._insertText());
    }

    if (oThis._isVideoIdPresent()) {
      promiseArray.push(oThis._fetchVideoDetailsAndValidate());
    }

    promiseArray.push(oThis._fetchToUserIdsAndAmounts());

    await Promise.all(promiseArray);
  }

  /**
   * This function prepares extra data for giphy and inserts a row in external entities table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertGiphyInExternalEntities() {
    const oThis = this;

    const entityKindInt = externalEntityConstants.invertedEntityKinds[externalEntityConstants.giphyEntityKind],
      entityId = oThis.giphyObject.id,
      extraData = oThis.giphyObject;

    const insertData = {
      entity_kind: entityKindInt,
      entity_id: entityId,
      extra_data: JSON.stringify(extraData)
    };

    const insertResponse = await new ExternalEntityModel().insert(insertData).fire();

    oThis.giphyExternalEntityId = insertResponse.insertId;
    insertData.id = oThis.giphyExternalEntityId;

    const formattedInsertData = new ExternalEntityModel().formatDbData(insertData);
    await ExternalEntityModel.flushCache(formattedInsertData);
  }

  /**
   * This function fetches to user ids and inserts in to user ids array. It also prepares amounts array.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchToUserIdsAndAmounts() {
    const oThis = this;
    const toOstUserIdsArray = [];

    // Loop to prepare array of toOstUserIds which will be used to fetch user ids from multi cache.
    for (let index = 0; index < oThis.transfersData.length; index++) {
      toOstUserIdsArray.push(oThis.transfersData[index].to_user_id);
    }

    const TokenUserData = await new TokenUserByOstUserIdsCache({ ostUserIds: toOstUserIdsArray }).fetch();

    if (TokenUserData.isFailure()) {
      return Promise.reject(TokenUserData);
    }

    // A separate for loop is written in order to ensure user ids and amount's index correspond
    // To each other in toUserIdsArray and amountsArray.
    for (let index = 0; index < oThis.transfersData.length; index++) {
      const toOstUserId = oThis.transfersData[index].to_user_id;
      if (TokenUserData.data[toOstUserId].userId) {
        oThis.toUserIdsArray.push(TokenUserData.data[toOstUserId].userId);
        oThis.amountsArray.push(oThis.transfersData[index].amount);
      }
    }
  }

  /**
   * This function prepares extra data for transaction external entity and inserts a row in external entities table.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _insertTransaction() {
    const oThis = this;

    let isDuplicateIndexViolation = false;

    const extraData = {
      toUserIds: oThis.toUserIdsArray,
      amounts: oThis.amountsArray,
      kind: transactionConstants.extraData.userTransactionKind
    };

    const insertData = {
      ost_tx_id: oThis.ostTxId,
      from_user_id: oThis.userId,
      video_id: oThis.videoId,
      extra_data: JSON.stringify(extraData),
      text_id: oThis.textId,
      giphy_id: oThis.giphyExternalEntityId,
      status: transactionConstants.invertedStatuses[oThis.transactionStatus]
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
            internal_error_identifier: 'a_s_ost_3',
            api_error_identifier: 'something_went_wrong',
            debug_options: { Error: err }
          });
          createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

          return Promise.reject(errorObject);
        }
      });

    if (!isDuplicateIndexViolation) {
      oThis.transactionId = insertResponse.insertId;
      insertData.id = insertResponse.insertId;

      const formattedInsertData = new TransactionModel().formatDbData(insertData);
      await TransactionModel.flushCache(formattedInsertData);
    }

    return { isDuplicateIndexViolation: isDuplicateIndexViolation };
  }

  /**
   * Insert in pending transaction table.
   *
   * @returns {Promise<void>}
   */
  async _insertInPendingTransactions() {
    const oThis = this;

    const insertData = {
      ost_tx_id: oThis.ostTxId,
      from_user_id: oThis.userId,
      video_id: oThis.videoId,
      to_user_id: oThis.toUserIdsArray[0],
      amount: oThis.amountsArray[0],
      status: transactionConstants.invertedStatuses[oThis.transactionStatus]
    };

    const insertResponse = await new PendingTransactionModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;

    const formattedInsertData = new PendingTransactionModel().formatDbData(insertData);
    await PendingTransactionModel.flushCache(formattedInsertData);
  }
}

module.exports = OstTransaction;

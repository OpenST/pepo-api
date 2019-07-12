/**
 * This service is for ost transaction
 *
 * Note:-
 */

const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  ActivityModel = require(rootPrefix + '/app/models/mysql/Activity'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  UserActivityModel = require(rootPrefix + '/app/models/mysql/UserActivity'),
  ExternalEntityModel = require(rootPrefix + '/app/models/mysql/ExternalEntity'),
  PendingTransactionModel = require(rootPrefix + '/app/models/mysql/PendingTransaction'),
  TokenUserByUserId = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TransactionByOstTxIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByOstTxId'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  ExternalEntitiesByEntityIdAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/single/ExternalEntitiyByEntityIdAndEntityKind'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  activityConstants = require(rootPrefix + '/lib/globalConstant/activity'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity');

class OstTransaction extends ServiceBase {
  /**
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.transaction = params.ost_transaction;
    oThis.userId = params.current_user.id;

    oThis.giphyObject = params.meta.giphy;
    oThis.text = params.meta.text;
    oThis.videoId = params.video_id;

    oThis.ostTxId = oThis.transaction.id;
    oThis.ostTransactionStatus = oThis.transaction.status.toUpperCase();
    oThis.transfersData = oThis.transaction.transfers;
    oThis.fromOstUserId = oThis.transfersData[0].from_user_id;

    oThis.textId = null;
    oThis.transactionId = null;
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

    oThis._setStatuses();

    let promiseArray1 = [];
    promiseArray1.push(oThis._fetchGiphyExternalEntityId());
    promiseArray1.push(oThis._fetchTransaction());
    if (oThis._isTextPresent()) {
      promiseArray1.push(oThis._insertText());
    }

    await Promise.all(promiseArray1);

    console.log('====oThis.transactionId===', oThis.transactionId);

    if (oThis.transactionId) {
      console.log('=====111111111');
      //update text id and giphy id if it is present
      if (oThis._isGiphyPresent() && !oThis.giphyExternalEntityId) {
        await oThis._insertGiphyInExternalEntities();
      }
      if (oThis.giphyExternalEntityId || oThis.textId) {
        await oThis._updateGiphyAndTextInTransaction();
      }
    } else {
      console.log('=====222222===');
      let promiseArray2 = [];
      promiseArray2.push(oThis._fetchOstUserIdAndValidate());
      promiseArray2.push(oThis._fetchVideoDetailsAndValidate());

      await Promise.all(promiseArray2);

      //Insert in external entities, transactions and pending transactions
      await oThis._insertGiphyAndTransaction();

      //Insert in activity table
      await oThis._insertInActivityTable();

      //Insert in user activity table
      await oThis._insertInUserActivityTable();
    }
    return Promise.resolve(responseHelper.successWithData());
  }

  /**
   * Set statuses
   *
   * @private
   */
  _setStatuses() {
    const oThis = this;

    if (oThis.ostTransactionStatus === transactionConstants.successOstTransactionStatus) {
      oThis.activityStatus = activityConstants.doneStatus;
      oThis.transactionStatus = transactionConstants.doneStatus;
    } else if (oThis.ostTransactionStatus === transactionConstants.failedOstTransactionStatus) {
      oThis.activityStatus = activityConstants.failedStatus;
      oThis.transactionStatus = transactionConstants.failedStatus;
    } else if (transactionConstants.notFinalizedOstTransactionStatuses.indexOf(oThis.ostTransactionStatus) > -1) {
      oThis.activityStatus = activityConstants.pendingStatus;
      oThis.transactionStatus = transactionConstants.pendingStatus;
    } else {
      throw new Error(`Invalid Ost Transaction Status. ExternalEntityId -${oThis.ostTransactionStatus}`);
    }
  }

  /**
   * Fetch giphy external entity id from db
   *
   * @returns {Boolean}
   * @private
   */
  async _fetchGiphyExternalEntityId() {
    const oThis = this;

    if (oThis._isGiphyPresent()) {
      let paramsForGiphy = {
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

    let insertData = {
        text: oThis.text
      },
      insertResponse = await new TextModel().insertText(insertData);

    oThis.textId = insertResponse.insertId;
    insertData.id = insertResponse.insertId;

    let formattedInsertData = new TextModel().formatDbData(insertData);
    await TextModel.flushCache(formattedInsertData);

    return Promise.resolve();
  }

  /**
   * Fetch transaction from db.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTransaction() {
    const oThis = this;

    let transactionCacheResponse = await new TransactionByOstTxIdCache({ ostTxIds: [oThis.ostTxId] }).fetch();

    if (transactionCacheResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: `a_s_ost_1`,
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            reason: 'Error while fetching data from TransactionByOstTxIdCache',
            ostTxIds: oThis.ostTxId
          }
        })
      );
    }

    console.log('==transactionCacheResponse==', transactionCacheResponse);

    oThis.transactionId = transactionCacheResponse.data[oThis.ostTxId].id;
    oThis.transactionObj = transactionCacheResponse.data[oThis.ostTxId];
  }

  /**
   * This function check if the giphy is present or not
   *
   * @returns {boolean}
   * @private
   */
  _isGiphyPresent() {
    const oThis = this;

    return !commonValidator.isVarNullOrUndefined(oThis.giphyObject);
  }

  /**
   * This function checks if string is non empty
   *
   * @returns {boolean}
   * @private
   */
  _isTextPresent() {
    const oThis = this;

    return commonValidator.validateNonBlankString(oThis.text);
  }

  /**
   * This function check if video is present in parameters
   *
   * @returns {boolean}
   * @private
   */
  _isVideoIdPresent() {
    const oThis = this;

    return !commonValidator.isVarNullOrUndefined(oThis.videoId);
  }

  /**
   * Fetch OST user id
   *
   * @private
   */
  async _fetchOstUserIdAndValidate() {
    const oThis = this;

    let userIds = [oThis.userId];

    let tokenUserDetailsResponse = await new TokenUserByUserId({ userIds: userIds }).fetch();

    if (tokenUserDetailsResponse.isFailure()) {
      return Promise.reject(tokenUserDetailsResponse);
    }

    let userIdToOstUserIdHash = {};
    for (let i = 0; i < userIds.length; i++) {
      let userId = userIds[i];
      //Returning only those entries ost user ids whose data is available
      if (tokenUserDetailsResponse.data[userId].ostUserId) {
        userIdToOstUserIdHash[userId] = tokenUserDetailsResponse.data[userId].ostUserId;
      }
    }

    oThis.ostUserId = userIdToOstUserIdHash[oThis.userId];

    if (!oThis.ostUserId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: `a_s_ot_5`,
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
  async _updateGiphyAndTextInTransaction() {
    const oThis = this;

    let updateData = {
        text_id: oThis.textId,
        giphy_id: oThis.giphyExternalEntityId
      },
      updateResponse = await new TransactionModel().update(updateData).fire();

    let transactionObj = oThis.transactionObj;
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

    let videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    let videoIdFromCache = videoDetailsCacheResponse.data[oThis.videoId].videoId;

    if (videoIdFromCache != oThis.videoId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_ot_7',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoIdFromCache: videoIdFromCache }
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
  async _insertGiphyAndTransaction() {
    const oThis = this;

    let promiseArray = [];

    if (oThis._isGiphyPresent() && !oThis.giphyExternalEntityId) {
      promiseArray.push(oThis._insertGiphyInExternalEntities());
    }

    promiseArray.push(oThis._insertTransaction());

    if (oThis.transactionStatus === transactionConstants.pendingStatus) {
      promiseArray.push(oThis._insertInPendingTransactions());
    }

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

    let entityKindInt = externalEntityConstants.invertedEntityKinds[externalEntityConstants.giphyEntityKind],
      entityId = oThis.giphyObject.id,
      extraData = oThis.giphyObject;

    let insertData = {
      entity_kind: entityKindInt,
      entity_id: entityId,
      extra_data: JSON.stringify(extraData)
    };

    let insertResponse = await new ExternalEntityModel().insert(insertData).fire();

    oThis.giphyExternalEntityId = insertResponse.insertId;
    insertData.id = oThis.giphyExternalEntityId;

    let formattedInsertData = new ExternalEntityModel().formatDbData(insertData);
    await ExternalEntityModel.flushCache(formattedInsertData);

    return Promise.resolve();
  }

  /**
   * This function prepares extra data for transaction external enntity and inserts a row in external entities table.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _insertTransaction() {
    const oThis = this;

    let toOstUserIdsArray = [];

    //Loop to prepare array of toOstUserIds which will be used to fetch user ids from multi cache.
    for (let i = 0; i < oThis.transfersData.length; i++) {
      toOstUserIdsArray.push(oThis.transfersData[i].to_user_id);
    }

    let TokenUserData = await new TokenUserByOstUserIdsCache({ ostUserIds: toOstUserIdsArray }).fetch();

    if (TokenUserData.isFailure()) {
      return Promise.reject(TokenUserData);
    }

    //A separate for loop is written in order to ensure user ids and amount's index correspond
    //to each other in toUserIdsArray and amountsArray.
    for (let i = 0; i < oThis.transfersData.length; i++) {
      let toOstUserId = oThis.transfersData[i].to_user_id;
      if (TokenUserData.data[toOstUserId].userId) {
        oThis.toUserIdsArray.push(TokenUserData.data[toOstUserId].userId);
        oThis.amountsArray.push(oThis.transfersData[i].amount);
      }
    }

    let extraData = {
      toUserIds: oThis.toUserIdsArray,
      amounts: oThis.amountsArray
    };

    let insertData = {
      ost_tx_id: oThis.ostTxId,
      from_user_id: oThis.userId,
      video_id: oThis.videoId,
      extra_data: JSON.stringify(extraData),
      text_id: oThis.textId,
      giphy_id: oThis.giphyExternalEntityId,
      status: transactionConstants.invertedStatuses[oThis.transactionStatus]
    };

    let insertResponse = await new TransactionModel().insert(insertData).fire(); //Todo: catch to see if we get duplicate exception

    oThis.transactionId = insertResponse.insertId;
    insertData.id = insertResponse.insertId;

    let formattedInsertData = new TransactionModel().formatDbData(insertData);
    await TransactionModel.flushCache(formattedInsertData);

    return Promise.resolve();
  }

  /**
   * This function enters data in feeds table
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInActivityTable() {
    const oThis = this;

    let currentTime = null,
      extraData = {};

    if (oThis.activityStatus !== activityConstants.pendingStatus) {
      currentTime = Math.floor(Date.now() / 1000);
    }

    oThis.publishedAtTs = currentTime;

    let insertData = {
      entity_type: activityConstants.transactionEntityType,
      entity_id: oThis.transactionId,
      extra_data: JSON.stringify(extraData),
      status: activityConstants.invertedStatuses[oThis.activityStatus],
      published_ts: oThis.publishedAtTs,
      display_ts: null
    };

    let insertResponse = await new ActivityModel().insert(insertData).fire();

    oThis.activityId = insertResponse.insertId;
    insertData.id = insertResponse.insertId;

    let formattedInsertData = new ActivityModel().formatDbData(insertData);
    await ActivityModel.flushCache(formattedInsertData);
  }

  /**
   * This function inserts data in user feeds table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInUserActivityTable() {
    const oThis = this;

    let insertData = {
      user_id: oThis.userId,
      activity_id: oThis.activityId,
      published_ts: oThis.publishedAtTs
    };

    await new UserActivityModel().insert(insertData).fire();

    if (oThis.activityStatus === activityConstants.doneStatus) {
      //Insert entry for to user ids as well.
      for (let i = 0; i < oThis.toUserIdsArray.length; i++) {
        let insertUserActivityData = {
          user_id: oThis.toUserIdsArray[i],
          activity_id: oThis.activityId,
          published_ts: oThis.publishedAtTs
        };

        await new UserActivityModel().insert(insertUserActivityData).fire();
      }
    }
  }

  /**
   * Insert in pending transaction table.
   *
   * @returns {Promise<void>}
   */
  async _insertInPendingTransactions() {
    const oThis = this;

    let insertData = {
      ost_tx_id: oThis.ostTxId,
      from_user_id: oThis.userId,
      video_id: oThis.videoId,
      to_user_id: oThis.toUserIdsArray[0],
      amount: oThis.amountsArray[0],
      status: transactionConstants.invertedStatuses[oThis.transactionStatus]
    };

    let insertResponse = await new PendingTransactionModel().insert(insertData).fire(); //Todo: catch to see if we get duplicate exception

    insertData.id = insertResponse.insertId;

    let formattedInsertData = new PendingTransactionModel().formatDbData(insertData);
    await PendingTransactionModel.flushCache(formattedInsertData);

    return Promise.resolve();
  }
}

module.exports = OstTransaction;

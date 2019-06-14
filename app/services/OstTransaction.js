/**
 * This service is for ost transaction
 *
 * Note:-
 */

const rootPrefix = '../../',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  TokenUserByUserId = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  ExternalEntityByIds = require(rootPrefix + '/lib/cacheManagement/multi/ExternalEntityByIds'),
  ExternalEntityModel = require(rootPrefix + '/app/models/mysql/ExternalEntity'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  ExternalEntitiesByEntityIdAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/single/ExternalEntitiyByEntityIdAndEntityKind'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity'),
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  userFeedConstants = require(rootPrefix + '/lib/globalConstant/userFeed'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class OstTransaction extends ServiceBase {
  /**
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.transactionUuid = params.ost_transaction_uuid;
    oThis.userId = params.current_user.id;
    oThis.privacyType = params.privacy_type.toUpperCase();

    oThis.giphyObject = params.meta.giphy;
    oThis.text = params.meta.text;

    oThis.ostTxExternalEntityId = null;
    oThis.transactionExternalEntityId = null;
    oThis.giphyExternalEntityId = null;
    oThis.toUserIdsArray = [];
    oThis.amountsArray = [];
  }

  /**
   * perform - perform get token details
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    //Cache hit at external entities table. Check if the transaction or giphy is already present.
    let isOstTxPresent = await oThis._checkExternalEntities();
    if (isOstTxPresent) {
      //If transaction is already present in external entity id. It is a duplicate
      return Promise.resolve(responseHelper.successWithData());
    }

    //Only if transaction is new. Request OST Platform to give transaction details.
    await oThis._requestTransactionDataFromOstPlatform();

    //Insert in external entities.
    await oThis._insertInExternalEntities();

    //Insert in feeds table
    await oThis._insertInFeedsTable();

    //Insert in user feeds
    await oThis._insertInUserFeedsTable();

    return Promise.resolve(responseHelper.successWithData());
  }

  /**
   * Check if transaction uuid or giphy is already present in external entities table
   *
   * @returns {Boolean}
   * @private
   */
  async _checkExternalEntities() {
    const oThis = this;

    //Check if transaction uuid is present in external entities table.
    let params = {
        entityId: oThis.transactionUuid,
        entityKind: externalEntityConstants.ostTransactionEntityKind
      },
      cacheResponse = await new ExternalEntitiesByEntityIdAndEntityKindCache(params).fetch();

    if (cacheResponse.data.id) {
      return true;
    }

    if (oThis._isGiphyPresent()) {
      //Check if giphy entity is present in external entities table.
      let paramsForGiphy = {
          entityId: oThis.giphyObject.id,
          entityKind: externalEntityConstants.giphyEntityKind
        },
        cacheResponseForGiphy = await new ExternalEntitiesByEntityIdAndEntityKindCache(paramsForGiphy).fetch();

      if (cacheResponseForGiphy.data.id) {
        oThis.giphyExternalEntityId = cacheResponseForGiphy.data.id;
      }
    }

    return false;
  }

  /**
   * This function check if the giphy is present or not
   *
   * @returns {boolean}
   * @private
   */
  _isGiphyPresent() {
    const oThis = this;

    return oThis.giphyObject !== undefined && oThis.giphyObject.id !== undefined;
  }

  /**
   * This function check if the text is present or not
   *
   * @returns {boolean}
   * @private
   */
  _isTextPresent() {
    const oThis = this;

    return !commonValidator.isVarNull(oThis.text) && oThis.text !== '';
  }

  /**
   * This function requests OST platform for transaction details
   *
   * @returns {Promise<never>}
   * @private
   */
  async _requestTransactionDataFromOstPlatform() {
    const oThis = this;

    let userIdToOstUserIdsHash = await oThis._fetchOstUserId([oThis.userId]);

    oThis.ostUserId = userIdToOstUserIdsHash[oThis.userId];
    if (!oThis.ostUserId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: `a_s_ot_b_5`,
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: oThis.userId }
        })
      );
    }

    let transactionParams = {
      transaction_id: oThis.transactionUuid,
      user_id: oThis.ostUserId
    };

    let transactionResponse = await jsSdkWrapper.getTransaction(transactionParams);

    if (transactionResponse.isFailure()) {
      logger.error('Transaction not fetched');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: `a_s_ot_b_2`,
          api_error_identifier: 'something_went_wrong',
          debug_options: { transactionParams: transactionParams }
        })
      );
    }

    let resultType = transactionResponse.data['result_type'];

    oThis.transactionStatus = transactionResponse.data[resultType].status.toUpperCase();
    oThis.transfersData = transactionResponse.data[resultType].transfers;

    if (oThis.ostUserId !== oThis.transfersData[0].from_user_id) {
      logger.error('Data mismatch: ost user id is not same as from user in transfer data.');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: `a_s_ot_b_6`,
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: oThis.userId, transfersData: oThis.transfersData }
        })
      );
    }
  }

  /**
   * This function return user id to ost user id hash.
   *
   * @param {Array} userIds
   * @returns {Promise<Hash>} user id to ost user id hash
   * @private
   */
  async _fetchOstUserId(userIds) {
    const oThis = this;

    let tokenUserDetailsResponse = await new TokenUserByUserId({ userIds: userIds }).fetch();

    let userIdToOstUserIdHash = {};
    for (let i = 0; i < userIds.length; i++) {
      let userId = userIds[i];
      //Returning only those entries ost user ids whose data is available
      if (tokenUserDetailsResponse.data[userId].ostUserId) {
        userIdToOstUserIdHash[userId] = tokenUserDetailsResponse.data[userId].ostUserId;
      }
    }
    return userIdToOstUserIdHash;
  }

  /**
   * This function inserts data in external entities table
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInExternalEntities() {
    const oThis = this;

    let promiseArray = [];

    if (oThis._isGiphyPresent() && !oThis.giphyExternalEntityId) {
      promiseArray.push(oThis._insertGiphyInExternalEntities());
    }

    promiseArray.push(oThis._insertTransactionInExternalEntities());

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
  async _insertTransactionInExternalEntities() {
    const oThis = this;

    let toOstUserIdsArray = [];

    //Loop to prepare array of toOstUserIds which will be used to fetch user ids from multi cache.
    for (let i = 0; i < oThis.transfersData.length; i++) {
      toOstUserIdsArray.push(oThis.transfersData[i].to_user_id);
    }

    let TokenUserData = await new TokenUserByOstUserIdsCache({ ostUserIds: toOstUserIdsArray }).fetch();

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
        kind: externalEntityConstants.extraData.userTransactionKind,
        fromUserId: oThis.ostUserId,
        toUserIds: oThis.toUserIdsArray,
        amounts: oThis.amountsArray,
        ostTransactionStatus: oThis.transactionStatus
      },
      entityKindInt = externalEntityConstants.invertedEntityKinds[externalEntityConstants.ostTransactionEntityKind],
      entityId = oThis.transactionUuid;

    let insertData = {
      entity_kind: entityKindInt,
      entity_id: entityId,
      extra_data: JSON.stringify(extraData)
    };

    let insertResponse = await new ExternalEntityModel().insert(insertData).fire();

    oThis.transactionExternalEntityId = insertResponse.insertId;
    insertData.id = insertResponse.insertId;

    let formattedInsertData = new ExternalEntityModel().formatDbData(insertData);
    await ExternalEntityModel.flushCache(formattedInsertData);

    return Promise.resolve();
  }

  /**
   * This function enters data in feeds table
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInFeedsTable() {
    const oThis = this;

    let currentTime = Math.floor(Date.now() / 1000),
      extraData = {};

    if (oThis.transactionStatus === externalEntityConstants.successOstTransactionStatus) {
      oThis.feedStatus = feedConstants.publishedStatus;
      oThis.publishedAtTs = currentTime;
    } else if (oThis.transactionStatus === externalEntityConstants.failedOstTransactionStatus) {
      oThis.feedStatus = feedConstants.failedStatus;
      oThis.publishedAtTs = currentTime;
    } else if (externalEntityConstants.notFinalizedOstTransactionStatuses.indexOf(oThis.transactionStatus) > -1) {
      oThis.feedStatus = feedConstants.pendingStatus;
      oThis.publishedAtTs = null;
    } else {
      throw new Error(`Invalid Ost Transaction Status. ExternalEntityId -${oThis.transactionExternalEntityId}`);
    }

    if (oThis._isGiphyPresent()) {
      extraData['giphyExternalEntityId'] = oThis.giphyExternalEntityId;
    }

    if (oThis._isTextPresent()) {
      extraData['text'] = oThis.text;
    }

    let insertData = {
      kind: feedConstants.invertedKinds[feedConstants.transactionKind],
      primary_external_entity_id: oThis.transactionExternalEntityId,
      extra_data: JSON.stringify(extraData),
      privacy_type: feedConstants.invertedPrivacyTypes[oThis.privacyType],
      status: feedConstants.invertedStatuses[oThis.feedStatus],
      published_ts: oThis.publishedAtTs
    };

    let insertResponse = await new FeedModel().insert(insertData).fire();

    oThis.feedId = insertResponse.insertId;
    insertData.id = insertResponse.insertId;

    let formattedInsertData = new FeedModel().formatDbData(insertData);
    await FeedModel.flushCache(formattedInsertData);
  }

  /**
   * This function inserts data in user feeds table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInUserFeedsTable() {
    const oThis = this;

    let insertData = {
      user_id: oThis.userId,
      feed_id: oThis.feedId,
      privacy_type: userFeedConstants.invertedPrivacyTypes[oThis.privacyType],
      published_ts: oThis.publishedAtTs
    };

    await new UserFeedModel().insert(insertData).fire();

    if (oThis.feedStatus === feedConstants.publishedStatus) {
      //Insert entry for to user ids as well.
      for (let i = 0; i < oThis.toUserIdsArray.length; i++) {
        let insertUserFeedData = {
          user_id: oThis.toUserIdsArray[i],
          feed_id: oThis.feedId,
          privacy_type: userFeedConstants.invertedPrivacyTypes[oThis.privacyType],
          published_ts: oThis.publishedAtTs
        };

        await new UserFeedModel().insert(insertUserFeedData).fire();
      }
    }
  }

  // /**
  //  * Prepares response entity and returns it.
  //  *
  //  * @returns {{transactionUuid: *, fromUserId: (String|*), toUserIds: (Array|*), amounts: (Array|*), status: *}}
  //  * @private
  //  */
  // async _prepareResponseEntities() {
  //   const oThis = this;
  //
  //   let externalEntityByIdsCache = await new ExternalEntityByIds({ ids: [oThis.transactionExternalEntityId] }).fetch();
  //
  //   if (externalEntityByIdsCache.isFailure() || !externalEntityByIdsCache.data[oThis.transactionExternalEntityId].id) {
  //     return Promise.reject(
  //       responseHelper.error({
  //         internal_error_identifier: 'a_s_ot_b_7',
  //         api_error_identifier: 'something_went_wrong',
  //         debug_options: { ids: [oThis.transactionExternalEntityId], msg: 'Error while fetching external entity' }
  //       })
  //     );
  //   }
  //
  //   let response = externalEntityByIdsCache.data[oThis.transactionExternalEntityId];
  //
  //   return responseHelper.successWithData({ ostTransaction: response });
  // }
}

module.exports = OstTransaction;

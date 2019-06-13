/**
 * This service is base for ost transaction
 *
 * Note:-
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  TokenUserByUserId = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity'),
  ExternalEntityModel = require(rootPrefix + '/app/models/mysql/ExternalEntity'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  ExternalEntitiesByEntityIdAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/single/ExternalEntitiyByEntityIdAndEntityKind'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class Base extends ServiceBase {
  /**
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.transactionUuid = params.ost_transaction_uuid;
    oThis.meta = params.meta;
    oThis.userId = params.current_user.id;

    oThis.giphyObject = oThis.meta.giphy;
    oThis.text = oThis.meta.text;
  }

  /**
   * perform - perform get token details
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    //Set Init params. This will set if the transaction is expression or direct send.
    oThis._setKind();

    //Cache hit at external entities table. Check if the transaction or giphy is already present.
    let response = await oThis._checkExternalEntities();
    if (response) {
      //If transaction is already present in external entity id. It is a duplicate
      return Promise.resolve(responseHelper.successWithData({ transactionDetails: response }));
    }

    //Only if transaction is new. Request OST Platform to give transaction details.
    await oThis._requestTransactionDataFromOstPlatform();

    //Insert in external entities.
    await oThis._insertInExternalEntities();

    //Insert in feeds table
    await oThis._insertInFeedsTable();

    //Insert in user feeds
    await oThis._insertInUserFeedsTable();

    return Promise.resolve(oThis._prepareResponseEntities());
  }

  /**
   * Check if transaction uuid or giphy is already present in external entities table
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkExternalEntities() {
    const oThis = this;

    //Check if transaction uuid is present in external entities table.
    let params = {
        entityId: oThis.transactionUuid,
        entityKind: externalEntityConstants.ostTransactionEntityKind
      },
      responseEntity = null,
      cacheResponse = await new ExternalEntitiesByEntityIdAndEntityKindCache(params).fetch();

    if (cacheResponse.isSuccess() && cacheResponse.data.id) {
      //Transaction is present in db
      let cacheData = cacheResponse.data;

      responseEntity = {
        transactionUuid: oThis.transactionUuid,
        fromUserId: cacheData.extraData.from_user_id,
        toUserIds: cacheData.extraData.to_user_ids,
        amounts: cacheData.extraData.amounts,
        status: cacheData.extraData.ost_transaction_status
      };

      return responseEntity;
    }

    //Check if giphy entity is present in external entities table.
    let paramsForGiphy = {
        entityId: oThis.giphyObject.id,
        entityKind: externalEntityConstants.giphyEntityKind
      },
      cacheResponseForGiphy = await new ExternalEntitiesByEntityIdAndEntityKindCache(paramsForGiphy).fetch();

    if (cacheResponseForGiphy.isSuccess() && cacheResponseForGiphy.data.id) {
      oThis.giphyExternalEntityId = cacheResponseForGiphy.data.id;
    }
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

    oThis.transactionStatus = transactionResponse.data[resultType].status;
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

    if (tokenUserDetailsResponse.isFailure()) {
      logger.error('Error while fetching token user details for userIds: ', userIds);
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: `a_s_ot_b_3`,
          api_error_identifier: 'something_went_wrong',
          debug_options: { userIds: userIds }
        })
      );
    }

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

    if (!oThis.giphyExternalEntityId) {
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
      extraData = {
        type: 'GIF',
        downsized: oThis.giphyObject.downsized,
        original: oThis.giphyObject.original
      };

    let insertResponse = await new ExternalEntityModel()
      .insert({
        entity_kind: entityKindInt,
        entity_id: entityId,
        extra_data: JSON.stringify(extraData)
      })
      .fire();

    oThis.giphyExternalEntityId = insertResponse.insertId;

    let clearCacheParams = {
      id: oThis.giphyExternalEntityId,
      entityId: entityId,
      entityKind: externalEntityConstants.giphyEntityKind
    };
    await ExternalEntityModel.flushCache(clearCacheParams);

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

    let toOstUserIdsArray = [],
      toUserIdsArray = [],
      amountsArray = [];

    //Loop to prepare array of toOstUserIds which will be used to fetch user ids from multi cache.
    for (let i = 0; i < oThis.transfersData.length; i++) {
      toOstUserIdsArray.push(oThis.transfersData[i].to_user_id);
    }

    let TokenUserData = await new TokenUserByOstUserIdsCache({ ostUserIds: toOstUserIdsArray }).fetch();
    if (TokenUserData.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: `a_s_ot_b_4`,
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    //A separate for loop is written in order to ensure user ids and amount's index correspond
    //to each other in toUserIdsArray and amountsArray.
    for (let i = 0; i < oThis.transfersData.length; i++) {
      let toOstUserId = oThis.transfersData[i].to_user_id;
      if (TokenUserData.data[toOstUserId].userId) {
        toUserIdsArray.push(TokenUserData.data[toOstUserId].userId);
        amountsArray.push(oThis.transfersData[i].amount);
      }
    }

    oThis.toUserIdsArray = toUserIdsArray; //To be used while inserting in user feeds table
    oThis.amountsArray = amountsArray;

    let extraData = {
        kind: externalEntityConstants.extraData.userTransactionKind,
        from_user_id: oThis.ostUserId,
        to_user_ids: toUserIdsArray,
        amounts: amountsArray,
        ost_transaction_status: oThis.transactionStatus
      },
      entityKindInt = externalEntityConstants.invertedEntityKinds[externalEntityConstants.ostTransactionEntityKind],
      entityId = oThis.transactionUuid;

    let insertResponse = await new ExternalEntityModel()
      .insert({
        entity_kind: entityKindInt,
        entity_id: entityId,
        extra_data: JSON.stringify(extraData)
      })
      .fire();

    oThis.transactionExternalEntityId = insertResponse.insertId;

    let clearCacheParams = {
      id: oThis.transactionExternalEntityId,
      entityId: entityId,
      entityKind: externalEntityConstants.ostTransactionEntityKind
    };
    await ExternalEntityModel.flushCache(clearCacheParams);

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

    let kind = oThis.transactionKind,
      primaryExternalEntityId = oThis.transactionExternalEntityId,
      extraData = {};
    oThis.publishedAtTs = null;

    if (oThis.transactionStatus === 'SUCCESS') {
      oThis.feedStatus = feedConstants.publishedStatus;
      oThis.publishedAtTs = Math.floor(Date.now() / 1000);
    } else if (oThis.transactionStatus === 'FAILED') {
      oThis.feedStatus = feedConstants.failedStatus;
    } else {
      oThis.feedStatus = feedConstants.pendingStatus;
    }

    extraData['giphy'] = {
      ee_id: oThis.giphyExternalEntityId,
      giphy_id: oThis.giphyObject.id
    };

    if (oThis.text) {
      extraData['text'] = oThis.text;
    }

    let insertResponse = await new FeedModel()
      .insert({
        kind: kind,
        primary_external_entity_id: primaryExternalEntityId,
        extra_data: JSON.stringify(extraData),
        status: feedConstants.invertedStatuses[oThis.feedStatus],
        published_ts: oThis.publishedAtTs
      })
      .fire();

    oThis.feedId = insertResponse.insertId;

    await FeedModel.flushCache({ id: oThis.feedId });
  }

  /**
   * This function inserts data in user feeds table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInUserFeedsTable() {
    const oThis = this;

    let insertResponse = await new UserFeedModel()
      .insert({
        user_id: oThis.userId,
        feed_id: oThis.feedId,
        published_ts: oThis.publishedAtTs
      })
      .fire();

    await UserFeedModel.flushCache({ id: insertResponse.insertId });

    if (oThis.feedStatus === feedConstants.publishedStatus) {
      //Insert entry for to user ids as well.
      for (let i = 0; i < oThis.toUserIdsArray.length; i++) {
        let toUserInsertResponse = await new UserFeedModel()
          .insert({
            user_id: oThis.toUserIdsArray[i],
            feed_id: oThis.feedId,
            published_ts: oThis.publishedAtTs
          })
          .fire();

        await UserFeedModel.flushCache({ id: toUserInsertResponse.insertId });
      }
    }
  }

  /**
   * Prepares response entity and returns it.
   *
   * @returns {{transactionUuid: *, fromUserId: (String|*), toUserIds: (Array|*), amounts: (Array|*), status: *}}
   * @private
   */
  _prepareResponseEntities() {
    const oThis = this;

    let responseEntity = {
      transactionUuid: oThis.transactionUuid,
      fromUserId: oThis.userId,
      toUserIds: oThis.toUserIdsArray,
      amounts: oThis.amountsArray,
      status: oThis.transactionStatus
    };

    return responseHelper.successWithData({ transactionDetails: responseEntity });
  }

  _setKind() {
    throw new Error('Sub-class to implement');
  }
}

module.exports = Base;

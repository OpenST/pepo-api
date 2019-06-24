const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TokenUserByOstUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByOstUserIds'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  ExternalEntityModel = require(rootPrefix + '/app/models/mysql/ExternalEntity'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class TransactionOstEventBase extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.data: contains the webhook event data
   * @param {String} params.data.user: User entity result from ost
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.ostTransaction = params.data.transaction;

    oThis.ostTransactionId = oThis.ostTransaction.id;
    oThis.ostTransactionStatus = oThis.ostTransaction.status;
    oThis.ostTransactionMinedTimestamp = oThis.ostTransaction.block_timestamp || null;

    oThis.externalEntityObj = null;
    oThis.privacyType = null;
    oThis.feedObj = null;
  }

  /**
   * perform -
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    throw `Unimplemented method _asyncPerform for TransactionOstEvent`;
  }

  /**
   * Validate Request
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for Transaction Webhook');
    let paramErrors = [];

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

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Get external Entity Row
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchExternalEntityObj() {
    const oThis = this;

    logger.log('Fetch external entity for Transaction Webhook');

    let externalEntityGetRes = await new ExternalEntityModel().fetchByEntityKindAndEntityId(
      externalEntityConstants.ostTransactionEntityKind,
      oThis.ostTransactionId
    );

    if (!externalEntityGetRes.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_oe_t_b_feeo_1',
          api_error_identifier: 'resource_not_found'
        })
      );
    }

    oThis.externalEntityObj = externalEntityGetRes;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * This function gives user id for the given ost user id(uuid).
   *
   * @param ostUserIds
   * @returns {Promise<void>}
   */
  async _getUserIdFromOstUserIds(ostUserIds) {
    const oThis = this;

    let tokenUserRsp = await new TokenUserByOstUserIdsCache({ ostUserIds: ostUserIds }).fetch();

    if (tokenUserRsp.isFailure()) {
      return Promise.reject(tokenUserRsp);
    }

    let ostUserIdToUserIdHash = {};

    for (let i = 0; i < ostUserIds.length; i++) {
      let ostUserId = ostUserIds[i];
      ostUserIdToUserIdHash[ostUserId] = tokenUserRsp.data[ostUserId].userId;
    }

    return ostUserIdToUserIdHash;
  }

  /**
   * Update ost transaction status in extra data of external Entity
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _updateExternalEntityObj() {
    const oThis = this;
    logger.log('Update external entity for Transaction Webhook');

    let extraData = oThis.externalEntityObj.extraData;
    extraData.ostTransactionStatus = oThis._validTransactionStatus();
    extraData.minedTimestamp = oThis.ostTransactionMinedTimestamp;

    await new ExternalEntityModel()
      .update({
        extra_data: JSON.stringify(extraData)
      })
      .where(['id = ?', oThis.externalEntityObj.id])
      .fire();

    oThis.externalEntityObj.parsedExtraData = extraData;

    await ExternalEntityModel.flushCache(oThis.externalEntityObj);

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * updateOtherEntity as per the transaction
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _updateOtherEntity() {
    const oThis = this;
    logger.log('Update other entity for Transaction Webhook');

    switch (oThis.externalEntityObj.parsedExtraData.kind) {
      case externalEntityConstants.extraData.airdropKind: {
        await oThis._processForAirdropTransaction();
        break;
      }
      case externalEntityConstants.extraData.userTransactionKind: {
        await oThis._processForUserTransaction();
        break;
      }
      default:
        throw new Error(`Unsupported externalEntities.extraData.kind ${oThis.externalEntityObj.parsedExtraData.kind}`);
    }
    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Update Feeds and User Feed
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _processForUserTransaction() {
    const oThis = this;
    logger.log('Process on User Transaction of Transaction Webhook');

    let feedObjRes = await new FeedModel().fetchByPrimaryExternalEntityId(oThis.externalEntityObj.id);

    if (!feedObjRes.id) {
      throw `Feed Object not found for externalEntityObj- ${oThis.externalEntityObj}`;
    }

    oThis.feedObj = feedObjRes;
    oThis.privacyType = oThis.feedObj.privacyType;

    if (oThis.feedObj.status === feedConstants.invertedStatuses[oThis._feedStatus()]) {
      return Promise.resolve(responseHelper.successWithData({}));
    }

    let userFeedObj = await new UserFeedModel().fetchByFeedId(oThis.feedObj.id);

    if (!userFeedObj.id) {
      throw `User Feed Object not found for externalEntityObj- ${oThis.externalEntityObj}`;
    }

    let published_ts = oThis._published_timestamp();

    await new FeedModel()
      .update({
        published_ts: published_ts,
        display_ts: oThis.ostTransactionMinedTimestamp,
        status: feedConstants.invertedStatuses[oThis._feedStatus()]
      })
      .where(['id = ?', oThis.feedObj.id])
      .fire();

    await new UserFeedModel()
      .update({
        published_ts: published_ts
      })
      .where(['id = ?', userFeedObj.id])
      .fire();

    await FeedModel.flushCache({ id: oThis.feedObj.id });
    //await UserFeedModel.flushCache({ id: userFeedObj.id });

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Mark Airdrop Failed Property for Token USer
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _processForAirdropTransaction() {
    const oThis = this;
    logger.log('Update other entity for Transaction Webhook');

    let toUserId = oThis.externalEntityObj.parsedExtraData.toUserIds[0];

    let tokenUserObjRes = await new TokenUserByUserIdCache({
      userIds: [toUserId]
    }).fetch();

    if (tokenUserObjRes.isFailure()) {
      return Promise.reject(tokenUserObjRes);
    }

    if (!tokenUserObjRes.data[toUserId].id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_b_2',
          api_error_identifier: 'resource_not_found'
        })
      );
    }

    let tokenUserObj = tokenUserObjRes.data[toUserId];
    let propertyVal = oThis._getPropertyValForTokenUser(tokenUserObj.properties);

    await new TokenUserModel()
      .update({
        properties: propertyVal
      })
      .where(['id = ?', tokenUserObj.id])
      .fire();

    await TokenUserModel.flushCache({ userId: tokenUserObj.userId });

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Current Timestamo in Seconds
   *
   *
   * @return {Integer}
   *
   * @private
   */
  _published_timestamp() {
    return Math.round(new Date() / 1000);
  }

  /**
   * Transaction Status
   *
   *
   * @return {String}
   *
   * @private
   */
  _validTransactionStatus() {
    throw `Unimplemented method validTransactionStatus for TransactionOstEvent`;
  }

  /**
   * Transaction Status
   *
   *
   * @return {String}
   *
   * @private
   */
  _feedStatus() {
    throw `Unimplemented method feedStatus for TransactionOstEvent`;
  }

  /**
   * Get New Property Val for Token USer
   *
   *
   * @return {Integer}
   *
   * @private
   */
  _getPropertyValForTokenUser() {
    throw `Unimplemented method getPropertyValForTokenUser for TransactionOstEvent`;
  }
}

module.exports = TransactionOstEventBase;

const rootPrefix = '../../../..',
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity'),
  userFeedConstants = require(rootPrefix + '/lib/globalConstant/userFeed'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class SuccessTransactionOstEvent extends TransactionOstEventBase {
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
  }

  /**
   * perform - Validate Login Credentials
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchExternalEntityObj();

    if (oThis.externalEntityObj.extraData.kind === externalEntityConstants.extraData.userTransactionKind) {
      await oThis._validateTransactionExternalEntityObj();
    }

    await oThis._updateExternalEntityObj();

    await oThis._updateOtherEntity();

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Validate external entity object
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateTransactionExternalEntityObj() {
    const oThis = this;
    logger.log('Validate external entity object');

    if (oThis.externalEntityObj.entityId !== oThis.ostTransactionId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_b_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { entityId: oThis.externalEntityObj.entityId }
        })
      );
    }

    // From user id will be same for all transfers in a transaction.
    let fromOstUserId = oThis.ostTransaction.transfers[0].from_user_id,
      ostUserIdToUserIdHashFrom = await oThis._getUserIdFromOstUserIds([fromOstUserId]),
      fromUserId = ostUserIdToUserIdHashFrom[fromOstUserId];

    await oThis._validateTransfers();
  }

  /**
   * Validate transfers entity
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateTransfers() {
    const oThis = this;

    let transfersArray = oThis.ostTransaction.transfers;

    let ostUserIdToAmountsHash = {},
      toOstUserIdsArray = [];
    //Prepare ost user id to amount hash
    for (let i = 0; i < transfersArray.length; i++) {
      let toOstUserId = transfersArray[i].to_user_id,
        amount = transfersArray[i].amount;
      ostUserIdToAmountsHash[toOstUserId] = amount;
      toOstUserIdsArray.push(toOstUserId);
    }

    let ostUserIdToUserIdsHash = await oThis._getUserIdFromOstUserIds(toOstUserIdsArray);

    let extraData = oThis.externalEntityObj.extraData,
      externalEntityToUserIdsArray = extraData.toUserIds,
      externalEntityAmountArray = extraData.amounts;

    for (let ostUserId in ostUserIdToAmountsHash) {
      let userId = ostUserIdToUserIdsHash[ostUserId],
        indexOfUserIdInExtraData = externalEntityToUserIdsArray.indexOf(userId);

      if (indexOfUserIdInExtraData < 0) {
        logger.error('Improper to-user id');
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_oe_t_s_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: { ostUserId: ostUserId, userId: userId, ostUserIdToUserIdsHash: ostUserIdToUserIdsHash }
          })
        );
      }

      //Check if amounts are equal
      if (ostUserIdToAmountsHash[ostUserId] !== externalEntityAmountArray[indexOfUserIdInExtraData]) {
        logger.error('Amount mismatch');
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_oe_t_s_2',
            api_error_identifier: 'something_went_wrong',
            debug_options: {
              ostUserId: ostUserId,
              userId: userId,
              amountInWebhooksData: ostUserIdToAmountsHash[ostUserId],
              amountInExternalEntity: externalEntityAmountArray[indexOfUserIdInExtraData]
            }
          })
        );
      }
    }
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
    return externalEntityConstants.successOstTransactionStatus;
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
    return 'todo::change_me';
  }

  /**
   * Get New Property Val for Token USer
   *
   *
   * @return {Integer}
   *
   * @private
   */
  _getPropertyValForTokenUser(propertyVal) {
    const oThis = this;
    logger.log('Get PropertyVal for Transaction Success Webhook');

    propertyVal = new TokenUserModel().setBitwise('properties', propertyVal, tokenUserConstants.airdropDoneProperty);

    return propertyVal;
  }

  /**
   * Update Feeds and User Feed
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _processForUserTransaction() {
    const oThis = this;
    logger.log('Process on User Transaction of Transaction Success Webhook');

    await super._processForUserTransaction();

    let insertRsp = await new UserFeedModel()
      .insert({
        user_id: oThis.externalEntityObj.parsedExtraData.toUserIds[0],
        feed_id: oThis.feedObj.id,
        privacy_type: userFeedConstants.invertedPrivacyTypes[oThis.privacyType],
        published_ts: oThis._published_timestamp()
      })
      .fire();

    //await UserFeedModel.flushCache({ id: insertRsp.insertId });

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = SuccessTransactionOstEvent;

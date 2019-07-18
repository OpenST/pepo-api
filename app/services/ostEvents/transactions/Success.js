const rootPrefix = '../../../..',
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserActivityModel = require(rootPrefix + '/app/models/mysql/UserActivity'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  activityConstants = require(rootPrefix + '/lib/globalConstant/activity'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
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

    let promiseArray = [];

    promiseArray.push(oThis._fetchTransaction());

    promiseArray.push(oThis._setFromAndToUserId());

    if (oThis._isVideoIdPresent()) {
      promiseArray.push(oThis._fetchVideoAndValidate());
    }

    await Promise.all(promiseArray);

    if (oThis.transactionObj) {
      await oThis._updateTransactionAndRelatedActivities();
    } else {
      let insertResponse = await oThis._insertInTransaction();
      if (insertResponse.isDuplicateIndexViolation) {
        basicHelper.sleep(500);
        await oThis._fetchTransaction();
        await oThis._updateTransactionAndRelatedActivities();
      } else {
        await oThis._insertInActivity();

        let promiseArray2 = [];
        promiseArray2.push(oThis._insertInUserActivity(oThis.fromUserId));
        promiseArray2.push(oThis._insertInUserActivity(oThis.toUserId));

        await Promise.all(promiseArray2);
      }
    }

    //Todo: Update Stats

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * This function is called when transaction exists in table. This function updates transaction and related activities.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTransactionAndRelatedActivities() {
    const oThis = this;

    await oThis._validateTransactionObj();
    let promiseArray1 = [],
      promiseArray2 = [];

    promiseArray1.push(oThis._updateTransaction());
    promiseArray1.push(oThis._updateActivity());
    promiseArray1.push(oThis._removeEntryFromPendingTransactions());

    await Promise.all(promiseArray1);

    promiseArray2.push(oThis._updateUserActivity(oThis.activityObj.id));
    promiseArray2.push(oThis._insertInUserActivity(oThis.toUserId));

    await Promise.all(promiseArray2);
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

    let extraData = oThis.transactionObj.extraData,
      transactionToUserIdsArray = extraData.toUserIds,
      transactionAmountArray = extraData.amounts;

    for (let ostUserId in ostUserIdToAmountsHash) {
      let userId = ostUserIdToUserIdsHash[ostUserId],
        indexOfUserIdInExtraData = transactionToUserIdsArray.indexOf(userId);

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
      if (ostUserIdToAmountsHash[ostUserId] !== transactionAmountArray[indexOfUserIdInExtraData]) {
        logger.error('Amount mismatch');
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_oe_t_s_2',
            api_error_identifier: 'something_went_wrong',
            debug_options: {
              ostUserId: ostUserId,
              userId: userId,
              amountInWebhooksData: ostUserIdToAmountsHash[ostUserId],
              amountInExternalEntity: transactionAmountArray[indexOfUserIdInExtraData]
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
    return transactionConstants.successOstTransactionStatus;
  }

  /**
   * Activity Status
   *
   *
   * @return {String}
   *
   * @private
   */
  _activityStatus() {
    return activityConstants.doneStatus;
  }

  /**
   * Transaction status
   *
   * @returns {string}
   * @private
   */
  _transactionStatus() {
    return transactionConstants.doneStatus;
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

    let insertRsp = await new UserActivityModel()
      .insert({
        user_id: oThis.transactionObj.extraData.toUserIds[0],
        activity_id: oThis.activityObj.id,
        published_ts: oThis.activityObj.publishedTs
      })
      .fire();

    let userActivityObj = {};
    userActivityObj.id = insertRsp.insertId;
    userActivityObj.userId = oThis.transactionObj.extraData.toUserIds[0];
    userActivityObj.activityId = oThis.activityObj.id;
    userActivityObj.publishedTs = oThis.activityObj.publishedTs;

    await UserActivityModel.flushCache(userActivityObj);

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = SuccessTransactionOstEvent;

const rootPrefix = '../../../..',
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UpdateStats = require(rootPrefix + '/lib/UpdateStats'),
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
      //Transaction is found in db. All updates happen in this block.
      await oThis._processTransaction();
    } else {
      //When transaction is not found in db. Thus all insertions will happen in this block.
      let insertResponse = await oThis._insertInTransaction();
      if (insertResponse.isDuplicateIndexViolation) {
        basicHelper.sleep(500);
        await oThis._fetchTransaction();
        await oThis._processTransaction();
      } else {
        await oThis._insertInActivity();

        let promiseArray2 = [];
        promiseArray2.push(oThis._insertInUserActivity(oThis.fromUserId));
        promiseArray2.push(oThis._insertInUserActivity(oThis.toUserId));

        await Promise.all(promiseArray2);
        await oThis._updateStats();
      }
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Process transaction when transaction is found in the database.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _processTransaction() {
    const oThis = this;

    let response = await oThis._validateTransactionObj();

    if (response.isFailure()) {
      //Transaction status need not be changed.
      return Promise.resolve(responseHelper.successWithData({}));
    }

    if (oThis.transactionObj.extraData.kind === transactionConstants.extraData.userTransactionKind) {
      await oThis._updateTransactionAndRelatedActivities();
      await oThis._updateStats();
    } else if (oThis.transactionObj.extraData.kind === transactionConstants.extraData.airdropKind) {
      await oThis._processForAirdropTransaction();
    }
  }

  /**
   * This function is called when transaction exists in table. This function updates transaction and related activities.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTransactionAndRelatedActivities() {
    const oThis = this;

    await oThis._validateTransfers();
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
   * Update stats after transaction
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateStats() {
    const oThis = this;

    let updateStatsParams = {
      fromUserId: oThis.fromUserId,
      toUserId: oThis.toUserId,
      totalAmount: oThis.ostTransaction.transfers[0].amount
    };

    if (oThis._isVideoIdPresent()) {
      updateStatsParams.videoId = oThis.videoId;
    }

    let updateStatsObj = new UpdateStats(updateStatsParams);

    await updateStatsObj.perform();
  }

  /**
   * Transaction Status.
   *
   * @return {String}
   *
   * @private
   */
  _validTransactionStatus() {
    return transactionConstants.successOstTransactionStatus;
  }

  /**
   * Activity Status.
   *
   * @return {String}
   *
   * @private
   */
  _activityStatus() {
    return activityConstants.doneStatus;
  }

  /**
   * Transaction status.
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
}

module.exports = SuccessTransactionOstEvent;

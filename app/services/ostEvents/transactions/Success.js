const rootPrefix = '../../../..',
  UpdateStats = require(rootPrefix + '/lib/UpdateStats'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  VideoTransactionSendSuccessNotification = require(rootPrefix +
    '/lib/userNotificationPublisher/VideoTransactionSendSuccess'),
  VideoTransactionReceiveSuccessNotification = require(rootPrefix +
    '/lib/userNotificationPublisher/VideoTransactionReceiveSuccess'),
  ProfileTransactionSendSuccessNotification = require(rootPrefix +
    '/lib/userNotificationPublisher/ProfileTransactionSendSuccess'),
  ProfileTransactionReceiveSuccessNotification = require(rootPrefix +
    '/lib/userNotificationPublisher/ProfileTransactionReceiveSuccess'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  activityConstants = require(rootPrefix + '/lib/globalConstant/activity'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for success transaction ost event base service.
 *
 * @class SuccessTransactionOstEvent
 */
class SuccessTransactionOstEvent extends TransactionOstEventBase {
  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    const promiseArray = [];

    promiseArray.push(oThis.fetchTransaction());
    promiseArray.push(oThis.setFromAndToUserId());

    if (oThis.isVideoIdPresent()) {
      promiseArray.push(oThis.fetchVideoAndValidate());
    }

    await Promise.all(promiseArray);

    if (oThis.transactionObj) {
      // Transaction is found in db. All updates happen in this block.
      await oThis._processTransaction();
    } else {
      // When transaction is not found in db. Thus all insertions will happen in this block.
      const insertResponse = await oThis.insertInTransaction();
      if (insertResponse.isDuplicateIndexViolation) {
        await basicHelper.sleep(500);
        await oThis.fetchTransaction();
        await oThis._processTransaction();
      } else {
        await oThis.insertInActivity();

        const promiseArray2 = [];
        promiseArray2.push(oThis.insertInUserActivity(oThis.fromUserId));
        promiseArray2.push(oThis.insertInUserActivity(oThis.toUserId));

        promiseArray2.push(oThis._sendUserNotification());

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

    const response = await oThis.validateTransactionObj();

    if (response.isFailure()) {
      // Transaction status need not be changed.
      return Promise.resolve(responseHelper.successWithData({}));
    }

    if (oThis.transactionObj.extraData.kind === transactionConstants.extraData.userTransactionKind) {
      await oThis._updateTransactionAndRelatedActivities();
      await oThis._updateStats();
    } else if (oThis.transactionObj.extraData.kind === transactionConstants.extraData.airdropKind) {
      await oThis.validateToUserId();
      const promiseArray = [];
      promiseArray.push(oThis.updateTransaction());
      promiseArray.push(oThis.processForAirdropTransaction());
      await Promise.all(promiseArray);
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

    await oThis.validateTransfers();
    const promiseArray1 = [],
      promiseArray2 = [];

    promiseArray1.push(oThis.updateTransaction());
    promiseArray1.push(oThis.updateActivity());
    promiseArray1.push(oThis.removeEntryFromPendingTransactions());

    await Promise.all(promiseArray1);

    promiseArray2.push(oThis.updateUserActivity(oThis.activityObj.id));
    promiseArray2.push(oThis.insertInUserActivity(oThis.toUserId));

    promiseArray2.push(oThis._sendUserNotification());

    await Promise.all(promiseArray2);
  }

  /**
   * Update stats after transaction.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateStats() {
    const oThis = this;

    const updateStatsParams = {
      fromUserId: oThis.fromUserId,
      toUserId: oThis.toUserId,
      totalAmount: oThis.ostTransaction.transfers[0].amount
    };

    if (oThis.isVideoIdPresent()) {
      updateStatsParams.videoId = oThis.videoId;
    }

    const updateStatsObj = new UpdateStats(updateStatsParams);

    await updateStatsObj.perform();
  }

  /**
   * Send notification for successful transaction.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendUserNotification() {
    const oThis = this;

    const promisesArray = [];

    if (oThis.videoId) {
      promisesArray.push(
        new VideoTransactionSendSuccessNotification({
          transaction: oThis.transactionObj,
          videoId: oThis.videoId
        }).perform()
      );
      promisesArray.push(
        new VideoTransactionReceiveSuccessNotification({
          transaction: oThis.transactionObj,
          videoId: oThis.videoId
        }).perform()
      );
    } else {
      promisesArray.push(
        new ProfileTransactionSendSuccessNotification({ transaction: oThis.transactionObj }).perform()
      );
      promisesArray.push(
        new ProfileTransactionReceiveSuccessNotification({ transaction: oThis.transactionObj }).perform()
      );
    }

    await Promise.all(promisesArray);
  }

  /**
   * Return transaction status.
   *
   * @return {string}
   * @private
   */
  _validTransactionStatus() {
    return transactionConstants.successOstTransactionStatus;
  }

  /**
   * Activity status.
   *
   * @return {string}
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
   * Get new property value for token user.
   *
   * @param {number} propertyVal
   *
   * @returns {number}
   * @private
   */
  _getPropertyValForTokenUser(propertyVal) {
    logger.log('Get PropertyVal for Transaction Success Webhook.');

    propertyVal = new TokenUserModel().setBitwise('properties', propertyVal, tokenUserConstants.airdropDoneProperty);

    return propertyVal;
  }
}

module.exports = SuccessTransactionOstEvent;

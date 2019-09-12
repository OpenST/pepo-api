const rootPrefix = '../../../..',
  UpdateStats = require(rootPrefix + '/lib/UpdateStats'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  UserDeviceIdsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceIdsByUserIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment');

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
        const promiseArray2 = [];

        promiseArray2.push(oThis._sendUserNotification());

        await Promise.all(promiseArray2);
        await oThis._updateStats();
      }
    }

    await oThis._checkIfPushNotificationRequired();

    logger.log('Transaction Obj after receiving webhook: ', oThis.transactionObj);

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
      promiseArray.push(oThis._enqueueUserNotification(notificationJobConstants.airdropDone));
      await Promise.all(promiseArray);
    } else if (oThis.transactionObj.extraData.kind === transactionConstants.extraData.topUpKind) {
      await oThis.validateToUserId();
      const promiseArray = [];
      promiseArray.push(oThis.updateTransaction());
      promiseArray.push(oThis.processForTopUpTransaction());
      promiseArray.push(oThis._enqueueUserNotification(notificationJobConstants.topupDone));
      promiseArray.push(FiatPaymentModel.flushCache(oThis.transactionObj.fiatPaymentId));
      await Promise.all(promiseArray);
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
    promiseArray1.push(oThis.removeEntryFromPendingTransactions());

    await Promise.all(promiseArray1);

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
   * This function checks if push notification is required.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkIfPushNotificationRequired() {
    const oThis = this;

    logger.log('oThis.isPaperPlane =========', oThis.isPaperPlane);

    if (oThis.isPaperPlane) {
      const toUserIds = oThis.transactionObj.extraData.toUserIds,
        userDeviceCacheRsp = await new UserDeviceIdsByUserIdsCache({ userIds: toUserIds }).fetch();

      if (userDeviceCacheRsp.isFailure()) {
        return Promise.reject(userDeviceCacheRsp);
      }

      const userDeviceIds = userDeviceCacheRsp.data[toUserIds[0]];

      logger.log('userDeviceIds =========', userDeviceIds);

      if (Array.isArray(userDeviceIds) && userDeviceIds.length > 0) {
        await oThis._enqueueUserNotification(notificationJobConstants.paperPlaneTransaction);
      }
    }
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
        notificationJobEnqueue.enqueue(notificationJobConstants.videoTxSendSuccess, {
          transaction: oThis.transactionObj,
          videoId: oThis.videoId
        })
      );

      promisesArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.videoTxReceiveSuccess, {
          transaction: oThis.transactionObj,
          videoId: oThis.videoId
        })
      );
    } else {
      promisesArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.profileTxSendSuccess, {
          transaction: oThis.transactionObj
        })
      );

      promisesArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.profileTxReceiveSuccess, {
          transaction: oThis.transactionObj
        })
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

  _getPaymentStatus() {
    return fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.pepoTransferSuccessStatus];
  }
}

module.exports = SuccessTransactionOstEvent;

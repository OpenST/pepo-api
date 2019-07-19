const rootPrefix = '../../../..',
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  activityConstants = require(rootPrefix + '/lib/globalConstant/activity'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class FailureTransactionOstEvent extends TransactionOstEventBase {
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
      await oThis._processTransaction();
    } else {
      let insertResponse = await oThis._insertInTransaction();
      if (insertResponse.isDuplicateIndexViolation) {
        basicHelper.sleep(500);
        await oThis._fetchTransaction();
        await oThis._processTransaction();
      } else {
        await oThis._insertInActivity();
        await oThis._insertInUserActivity(oThis.fromUserId);
      }
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Process transaction when transaction is found in database.
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
    } else if (oThis.transactionObj.extraData.kind === transactionConstants.extraData.airdropKind) {
      await oThis._processForAirdropTransaction();
    }
  }

  /**
   *
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTransactionAndRelatedActivities() {
    const oThis = this;

    await oThis._validateTransfers();
    let promiseArray1 = [];

    promiseArray1.push(oThis._updateTransaction());
    promiseArray1.push(oThis._updateActivity());
    promiseArray1.push(oThis._removeEntryFromPendingTransactions());

    await Promise.all(promiseArray1);

    await oThis._updateUserActivity(oThis.activityObj.id);
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
    return transactionConstants.failedOstTransactionStatus;
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
    return activityConstants.failedStatus;
  }

  /**
   * Transaction status
   *
   * @returns {string}
   * @private
   */
  _transactionStatus() {
    return transactionConstants.failedStatus;
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
    logger.log('Get PropertyVal for Transaction Failure Webhook');

    propertyVal = new TokenUserModel().setBitwise('properties', propertyVal, tokenUserConstants.airdropFailedProperty);
    propertyVal = new TokenUserModel().unSetBitwise(
      'properties',
      propertyVal,
      tokenUserConstants.airdropStartedProperty
    );
    propertyVal = new TokenUserModel().unSetBitwise('properties', propertyVal, tokenUserConstants.airdropDoneProperty);

    return propertyVal;
  }
}

module.exports = FailureTransactionOstEvent;

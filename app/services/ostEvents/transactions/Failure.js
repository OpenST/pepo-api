'use strict';
/**
 * This service helps in processing the user activation success event from ost platform
 *
 */

const rootPrefix = '../../../..',
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity'),
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

    await oThis._fetchExternalEntityObj();

    await oThis._updateExternalEntityObj();

    await oThis._updateOtherEntity();

    return Promise.resolve(responseHelper.successWithData({}));
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
    return externalEntityConstants.failedOstTransactionStatus;
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
    return feedConstants.failedStatus;
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
    logger.log('Process on User Transaction Fail of Transaction Failure Webhook');

    await super._processForUserTransaction();

    return Promise.resolve(responseHelper.successWithData({}));
  }
}

module.exports = FailureTransactionOstEvent;

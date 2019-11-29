const rootPrefix = '../../../../..',
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  TransactionWebhookBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for airdrop failure transaction service.
 *
 * @class AirdropFailureWebhook
 */
class AirdropFailureWebhook extends TransactionWebhookBase {
  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    const promiseArray = [];

    promiseArray.push(oThis.fetchTransaction());
    promiseArray.push(oThis.setFromAndToUserId());

    await Promise.all(promiseArray);

    if (oThis.transactionObj) {
      await oThis._processTransaction();
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_f_ap_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: oThis.ostTransaction
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Process transaction when transaction is found in database.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _processTransaction() {
    const oThis = this;

    const response = await oThis.validateTransactionObj();

    if (response.isFailure()) {
      // Transaction status need not be changed.
      return responseHelper.successWithData({});
    }

    await oThis.validateToUserId();
    const promiseArray = [];
    promiseArray.push(oThis.updateTransaction());
    promiseArray.push(oThis.processForAirdropTransaction());
    await Promise.all(promiseArray);
  }

  /**
   * Return transaction status.
   *
   * @return {string}
   * @private
   */
  _validTransactionStatus() {
    return transactionConstants.failedOstTransactionStatus;
  }

  /**
   * Transaction status.
   *
   * @returns {string}
   * @private
   */
  _transactionStatus() {
    return transactionConstants.failedStatus;
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

module.exports = AirdropFailureWebhook;

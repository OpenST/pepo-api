/**
 * Formatter for get Transaction Details to convert keys to snake case.
 *
 * @module lib/formatter/entity/Transaction
 */

const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for POST Transaction formatter.
 *
 * @class
 */
class Transaction {
  /**
   * Constructor for POST Transaction formatter.
   *
   * @param {Object} params
   * @param {Object} params.transactionDetails
   *
   * @param {String} params.transactionDetails.transactionUuid
   * @param {String} params.transactionDetails.fromUserId
   * @param {Array} params.transactionDetails.toUserIds
   * @param {Array} params.transactionDetails.amounts
   * @param {String} params.transactionDetails.status
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.transactionDetails = params.transactionDetails;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const formattedData = {
      transaction_id: oThis.transactionDetails.transactionUuid,
      from_user_id: oThis.transactionDetails.fromUserId,
      to_user_ids: oThis.transactionDetails.toUserIds,
      amounts: oThis.transactionDetails.amounts,
      status: oThis.transactionDetails.status.toUpperCase()
    };

    return responseHelper.successWithData(formattedData);
  }
}

module.exports = Transaction;

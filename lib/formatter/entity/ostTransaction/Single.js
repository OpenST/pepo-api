/**
 * Formatter for get Transaction Details to convert keys to snake case.
 *
 * @module lib/formatter/entity/ostTransaction/Single
 */

const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for POST Transaction formatter.
 *
 * @class
 */
class OstTransactionSingleFormatter {
  /**
   * Constructor for POST Transaction formatter.
   *
   * @param {Object} params
   * @param {Object} params.ostTransaction
   *
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.ostTransaction = params.ostTransaction;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const formattedData = {
      id: oThis.ostTransaction.id,
      ost_id: oThis.ostTransaction.entityId,
      from_user_id: oThis.ostTransaction.extraData.fromUserId,
      to_user_ids: oThis.ostTransaction.extraData.toUserIds,
      amounts: oThis.ostTransaction.extraData.amounts,
      status: oThis.ostTransaction.extraData.toUpperCase()
    };

    return responseHelper.successWithData(formattedData);
  }
}

module.exports = OstTransactionSingleFormatter;

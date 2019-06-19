/**
 * Formatter for get Transaction Details to convert keys to snake case.
 *
 * @module lib/formatter/entity/ostTransaction/Single
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for POST Transaction formatter.
 *
 * @class OstTransactionSingleFormatter
 */
class OstTransactionSingleFormatter {
  /**
   * Constructor for POST Transaction formatter.
   *
   * @param {object} params
   * @param {object} params.ostTransaction
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

    let extraData = oThis.ostTransaction.extraData;

    const formattedData = {
      id: oThis.ostTransaction.id,
      ost_id: oThis.ostTransaction.entityId,
      from_user_id: extraData.fromUserId,
      to_user_ids: extraData.toUserIds,
      amounts: extraData.amounts,
      status: extraData.ostTransactionStatus.toUpperCase(),
      mined_timestamp: extraData.minedTimestamp
    };

    return responseHelper.successWithData(formattedData);
  }
}

module.exports = OstTransactionSingleFormatter;

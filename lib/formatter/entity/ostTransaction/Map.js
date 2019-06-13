/**
 * Formatter for ostTransaction entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/ostTransaction/Map
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  OstTransactionSingleFormatter = require(rootPrefix + '/lib/formatter/entity/ostTransaction/Single');

/**
 * Class for ost transaction formatter.
 *
 * @class
 */
class OstTransactionMapFormatter {
  /**
   * Constructor for ost transaction Map formatter.
   *
   * @param {Object} params
   * @param {Object} params.gifMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.ostTransactionMap = params.ostTransactionMap;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    let finalResponse = {};
    for (let id in oThis.ostTransactionMap) {
      let ostTransactionObj = oThis.ostTransactionMap[id],
        formattedOstTransaction = new OstTransactionSingleFormatter({ ostTransaction: ostTransactionObj }).perform();

      finalResponse[id] = formattedOstTransaction.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = OstTransactionMapFormatter;

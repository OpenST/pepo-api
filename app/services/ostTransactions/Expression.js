/**
 * This service is for expression kind of ost transaction
 *
 * Note:-
 */

const rootPrefix = '../../..',
  OstTransactionBase = require(rootPrefix + '/app/services/ostTransactions/Base'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed');

class Expression extends OstTransactionBase {
  /**
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Sets the kind of transaction
   *
   * @private
   */
  _setKind() {
    const oThis = this;

    oThis.transactionKind = feedConstants.invertedKinds[feedConstants.expressionKind];
  }
}

module.exports = Expression;

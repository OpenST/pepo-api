/**
 * This service is for send kind of ost transaction
 *
 * Note:-
 */

const rootPrefix = '../../..',
  OstTransactionBase = require(rootPrefix + '/app/services/ostTransactions/Base'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed');

class Send extends OstTransactionBase {
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

    oThis.transactionKind = feedConstants.invertedKinds[feedConstants.sendKind];
  }
}

module.exports = Send;

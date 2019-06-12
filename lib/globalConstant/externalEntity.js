const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds, invertedEntityKinds;

/**
 * Class for feed constants
 *
 * @class
 */
class ExternalEntityConstants {
  /**
   * Constructor for Feeds.
   *
   * @constructor
   */
  constructor() {}

  get ostTransactionEntityKind() {
    return 'OST_TRANSACTION';
  }

  get giphyEntityKind() {
    return 'GIPHY';
  }

  get entityKinds() {
    const oThis = this;

    return {
      '1': oThis.ostTransactionEntityKind,
      '2': oThis.giphyEntityKind
    };
  }

  get failedOstTransactionStatus() {
    return 'FAILED';
  }

  get successOstTransactionStatus() {
    return 'SUCCESS';
  }

  get extraData() {
    return {
      airdropKind: 'AIRDROP',
      userTransactionKind: 'USER_TRANSACTION'
    };
  }

  get invertedEntityKinds() {
    const oThis = this;

    if (invertedEntityKinds) {
      return invertedEntityKinds;
    }

    invertedEntityKinds = util.invert(oThis.entityKinds);

    return invertedEntityKinds;
  }
}

module.exports = new ExternalEntityConstants();

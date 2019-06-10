'use strict';
/**
 * Constants for external entity
 *
 * @module lib/globalConstant/externalEntity
 */

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
    return 'ostTransaction';
  }

  get giphyEntityKind() {
    return 'giphy';
  }

  get entityKinds() {
    const oThis = this;

    return {
      '1': oThis.ostTransactionEntityKind,
      '2': oThis.giphyEntityKind
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

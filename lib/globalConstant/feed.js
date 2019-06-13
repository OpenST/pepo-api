const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds;

/**
 * Class for feed constants
 *
 * @class
 */
class FeedConstants {
  /**
   * Constructor for Feeds.
   *
   * @constructor
   */
  constructor() {}

  get expressionKind() {
    return 'expression';
  }

  get sendKind() {
    return 'send';
  }

  get pendingStatus() {
    return 'pending';
  }

  get publishedStatus() {
    return 'published';
  }

  get failedStatus() {
    return 'failed';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.publishedStatus,
      '3': oThis.failedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.expressionKind,
      '2': oThis.sendKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new FeedConstants();

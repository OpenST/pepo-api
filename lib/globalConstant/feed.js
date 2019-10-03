const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for feed constants
 *
 * @class
 */
class FeedConstants {
  get personalizedFeedMaxIdsCount() {
    //Note: Should always be a multiple of page limit in feed
    return 500;
  }

  get personalizedFeedMinIdsCount() {
    //Note: Should always be a multiple of page limit in feed
    return 100;
  }

  get personalizedFeedSeenVideosAgeInSeconds() {
    return 14 * 60 * 60 * 24;
  }

  get fanUpdateKind() {
    return 'FAN_UPDATE';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.fanUpdateKind
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

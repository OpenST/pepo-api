const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for video constants
 *
 * @class
 */
class VideoConstants {
  /**
   * Constructor for video constants.
   *
   * @constructor
   */
  constructor() {}

  get activeStatus() {
    return 'active';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus
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
}

module.exports = new VideoConstants();

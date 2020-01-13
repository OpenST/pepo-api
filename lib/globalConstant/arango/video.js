const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for videos constants.
 *
 * @class Video
 */
class Video {
  get activeStatus() {
    return 'ACTIVE';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new Video();

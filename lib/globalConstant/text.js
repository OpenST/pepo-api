const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for text constants.
 *
 * @class
 */
class TextConstants {
  /**
   * Constructor for text constants.
   *
   * @constructor
   */
  constructor() {}

  get statuses() {
    const oThis = this;

    return {};
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

module.exports = new TextConstants();

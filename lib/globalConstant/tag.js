const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for for tags constants.
 *
 * @class
 */
class Tag {
  /**
   * Constructor for tags constants.
   *
   * @constructor
   */
  constructor() {}

  // Statuses start.
  get activeStatus() {
    return 'ACTIVE';
  }

  get inActiveStatus() {
    return 'INACTIVE';
  }

  get blockedStatus() {
    return 'BLOCKED';
  }
  // Statuses end.

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inActiveStatus,
      '3': oThis.blockedStatus
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

module.exports = new Tag();

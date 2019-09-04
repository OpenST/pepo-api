const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds;

/**
 * Class for temporary token constants.
 *
 * @class
 */
class TemporaryTokenConstant {
  /**
   * Constructor for temporary token constants.
   *
   * @constructor
   */
  constructor() {}

  get activeStatus() {
    return 'ACTIVE';
  }

  get inActiveStatus() {
    return 'INACTIVE';
  }

  get usedStatus() {
    return 'USED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inActiveStatus,
      '3': oThis.usedStatus
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

  get preLaunchInviteKind() {
    return 'PRE_LAUNCH_INVITE';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.preLaunchInviteKind
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

module.exports = new TemporaryTokenConstant();

const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds;

/**
 * Class for temporary token constants.
 *
 * @class TemporaryTokenConstant
 */
class TemporaryTokenConstant {
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

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get preLaunchInviteKind() {
    return 'PRE_LAUNCH_INVITE';
  }

  get emailDoubleOptInKind() {
    return 'EMAIL_DOUBLE_OPTIN';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.preLaunchInviteKind,
      '2': oThis.emailDoubleOptInKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  get tokenExpiryTimestamp() {
    return 60 * 60 * 24 * 30; // 30 days
  }
}

module.exports = new TemporaryTokenConstant();

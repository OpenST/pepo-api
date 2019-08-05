const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

/**
 * Class for UserNotification constants.
 *
 * @class UserNotificationConstants
 */
class UserNotificationConstants {
  get transactionKind() {
    return 'TRANSACTION';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.transactionKind
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

module.exports = new UserNotificationConstants();

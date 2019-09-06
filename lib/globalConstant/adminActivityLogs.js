const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedActions = null;

/**
 * Class for admin activity related logs.
 *
 * @class AdminActivityLogs
 */
class AdminActivityLogs {
  get approvedAsCreator() {
    return 'approvedAsCreator';
  }

  get deleteUserVideo() {
    return 'deleteUserVideo';
  }

  get blockUser() {
    return 'blockUser';
  }

  get actions() {
    const oThis = this;

    return {
      '1': oThis.approvedAsCreator,
      '2': oThis.deleteUserVideo,
      '3': oThis.blockUser
    };
  }

  get invertedActions() {
    const oThis = this;

    invertedActions = invertedActions || util.invert(oThis.actions);

    return invertedActions;
  }
}

module.exports = new AdminActivityLogs();

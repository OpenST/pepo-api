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

  get deleteUserVideos() {
    return 'deleteUserVideos';
  }

  get blockUser() {
    return 'blockUser';
  }

  get denyAsCreator() {
    return 'denyAsCreator';
  }

  get updateUserVideoLink() {
    return 'updateUserVideoLink';
  }

  get updateUserVideoDescription() {
    return 'updateUserVideoDescription';
  }

  get updateUserReplyDescription() {
    return 'updateUserReplyDescription';
  }

  get actions() {
    const oThis = this;

    return {
      '1': oThis.approvedAsCreator,
      '2': oThis.deleteUserVideos,
      '3': oThis.blockUser,
      '4': oThis.denyAsCreator,
      '5': oThis.updateUserVideoLink,
      '6': oThis.updateUserVideoDescription,
      '7': oThis.updateUserReplyDescription
    };
  }

  get invertedActions() {
    const oThis = this;

    invertedActions = invertedActions || util.invert(oThis.actions);

    return invertedActions;
  }
}

module.exports = new AdminActivityLogs();

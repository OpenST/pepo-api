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

  get deleteUser() {
    return 'deleteUser';
  }

  get muteUser() {
    return 'muteUser';
  }

  get unMuteUser() {
    return 'unMuteUser';
  }

  get denyAsCreator() {
    return 'denyAsCreator';
  }

  get emailSentForResubmission() {
    return 'emailSentForResubmission';
  }

  get updateUserVideoLink() {
    return 'updateUserVideoLink';
  }

  get updateUserVideoDescription() {
    return 'updateUserVideoDescription';
  }

  get updateCuratedEntity() {
    return 'updateCuratedEntity';
  }

  get deleteCuratedEntity() {
    return 'deleteCuratedEntity';
  }

  get updateUserReplyDescription() {
    return 'updateUserReplyDescription';
  }

  get unDeleteUser() {
    return 'unDeleteUser';
  }

  get actions() {
    const oThis = this;

    return {
      '1': oThis.approvedAsCreator,
      '2': oThis.deleteUserVideos,
      '3': oThis.deleteUser,
      '4': oThis.denyAsCreator,
      '5': oThis.updateUserVideoLink,
      '6': oThis.updateUserVideoDescription,
      '7': oThis.updateUserReplyDescription,
      '8': oThis.muteUser,
      '9': oThis.unMuteUser,
      '10': oThis.emailSentForResubmission,
      '11': oThis.updateCuratedEntity,
      '12': oThis.deleteCuratedEntity,
      '13': oThis.unDeleteUser
    };
  }

  get invertedActions() {
    const oThis = this;

    invertedActions = invertedActions || util.invert(oThis.actions);

    return invertedActions;
  }
}

module.exports = new AdminActivityLogs();

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

  get muteUser() {
    return 'muteUser';
  }

  get unMuteUser() {
    return 'unMuteUser';
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

  get insertNewCuratedEntity() {
    return 'insertNewCuratedEntity';
  }

  get deleteCuratedEntity() {
    return 'deleteCuratedEntity';
  }

  get reorderCuratedEntity() {
    return 'reorderCuratedEntity';
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
      '8': oThis.muteUser,
      '9': oThis.unMuteUser
      '10': oThis.updateUserVideoDescription,
      '11': oThis.insertNewCuratedEntity,
      '12': oThis.deleteCuratedEntity,
      '13': oThis.reorderCuratedEntity
    };
  }

  get invertedActions() {
    const oThis = this;

    invertedActions = invertedActions || util.invert(oThis.actions);

    return invertedActions;
  }
}

module.exports = new AdminActivityLogs();

const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedActions = null;

class AdminActivityLogs {
  get approveUser() {
    return 'approveUser';
  }

  get deleteVideo() {
    return 'deleteVideo';
  }

  get actions() {
    const oThis = this;

    return {
      '1': oThis.approveUser,
      '2': oThis.deleteVideo
    };
  }

  get invertedActions() {
    const oThis = this;

    if (invertedActions) {
      return invertedActions;
    }

    invertedActions = util.invert(oThis.actions);

    return invertedActions;
  }
}

module.exports = new AdminActivityLogs();

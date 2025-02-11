/**
 * Class for for goto constants.
 *
 * @class Goto
 */
class Goto {
  // Goto kinds start.
  get videoGotoKind() {
    return 'video';
  }

  get replyGotoKind() {
    return 'reply';
  }

  get communitiesUrlKind() {
    return 'communities';
  }

  get channelsGotoKind() {
    return 'channels';
  }

  get addEmailScreenGotoKind() {
    return 'addEmailScreen';
  }

  get signUpGotoKind() {
    return 'signup';
  }

  get webViewGotoKind() {
    return 'webview';
  }

  get invitedUsersGotoKind() {
    return 'invitedUsers';
  }

  get profileGotoKind() {
    return 'profile';
  }

  get notificationCentreGotoKind() {
    return 'notificationCentre';
  }

  get feedGotoKind() {
    return 'feed';
  }

  get contributedByGotoKind() {
    return 'contributedBy';
  }

  get tagGotoKind() {
    return 'tags';
  }

  get storeGotoKind() {
    return 'store';
  }

  get supportGotoKind() {
    return 'support';
  }

  get sessionAuthGotoKind() {
    return 'sessionAuth';
  }
  // Goto kinds end.
}

module.exports = new Goto();

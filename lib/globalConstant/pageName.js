/**
 * Class for notification page name constants.
 *
 * @class PageName
 */
class PageName {
  // Page name start.
  get profilePageName() {
    return 'p';
  }

  get videoPageName() {
    return 'v';
  }

  get contributedByPageName() {
    return 'cb';
  }

  get notificationCentrePageName() {
    return 'nc';
  }

  get feedPageName() {
    return 'f';
  }

  get addEmailScreen() {
    return 'e';
  }

  get signupScreen() {
    return 's';
  }

  get webViewScreen() {
    return 'wv';
  }

  get invitedUsersListPage() {
    return 'iu';
  }

  get storePepoWebView() {
    return 'sp';
  }

  get supportWebView() {
    return 'su';
  }

  get tagPage() {
    return 't';
  }
  // Page name end.

  // Page name param start.
  get profileUserIdParam() {
    return 'puid';
  }

  get videoIdParam() {
    return 'vid';
  }

  get replyDetailIdParam() {
    return 'rdi';
  }

  get inviteCodeParam() {
    return 'ic';
  }

  get webViewUrlParam() {
    return 'wu';
  }

  get tagIdParam() {
    return 'tid';
  }
  // Page name param end.
}

module.exports = new PageName();

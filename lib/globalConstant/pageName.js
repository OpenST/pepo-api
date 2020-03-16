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

  get replyDetailPageName() {
    return 'rd';
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

  get sessionAuthPage() {
    return 'sa';
  }

  get tagPage() {
    return 't';
  }

  get channelPage() {
    return 'ch';
  }
  // Page name end.

  // Page name param start.
  get profileUserIdParam() {
    return 'puid';
  }

  get profileActionParam() {
    return 'at';
  }

  get videoIdParam() {
    return 'vid';
  }

  get replyDetailIdParam() {
    return 'rdi';
  }

  get parentVideoIdParam() {
    return 'pvi';
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

  get channelIdParam() {
    return 'cid';
  }

  get sessionAuthPayloadIdParam() {
    return 'sap_id';
  }
  // Page name param end.
}

module.exports = new PageName();

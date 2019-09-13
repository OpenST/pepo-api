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

  get inviteCodePageScreen() {
    return 'i';
  }

  // Page name end.

  // Page name param start.
  get profileUserIdParam() {
    return 'puid';
  }

  get videoIdParam() {
    return 'vid';
  }

  get inviteCodeErrorParam() {
    return 'ice';
  }
  // Page name param end.
}

module.exports = new PageName();

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

  // Page name end.

  // Page name param start.
  get profileUserIdParam() {
    return 'puid';
  }

  get videoIdParam() {
    return 'vid';
  }
  // Page name param end.
}

module.exports = new PageName();

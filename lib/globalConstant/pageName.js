/**
 * Class for notification page name constants.
 *
 * @class PageName
 */
class PageName {
  // page name start.
  get profilePageName() {
    return 'p';
  }

  get videoPageName() {
    return 'v';
  }

  get contributedByPageName() {
    return 'cu';
  }

  // page name end.

  // page name param start.

  get profileUserIdParam() {
    return 'puid';
  }

  get contributedByParam() {
    return 'cuid';
  }

  get videoIdParam() {
    return 'vid';
  }

  // page name param end.
}

module.exports = new PageName();

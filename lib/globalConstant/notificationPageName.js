/**
 * Class for notification page name constants.
 *
 * @class NotificationPageName
 */
class NotificationPageName {
  // page name start.
  get profilePageName() {
    return 'p';
  }

  get videoPageName() {
    return 'v';
  }

  //todo: use contributed by
  get supporterPageName() {
    return 's';
  }

  // page name end.

  // page name entity start.

  //todo: param
  get profileUserIdEntity() {
    return 'puid';
  }

  get supporterUserIdEntity() {
    return 'suid';
  }

  get videoIdEntity() {
    return 'vid';
  }

  // page name entity end.
}

module.exports = new NotificationPageName();

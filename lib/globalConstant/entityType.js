class EntityType {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {}

  get user() {
    return 'user';
  }

  get loggedInUser() {
    return 'logged_in_user';
  }

  get recoveryInfo() {
    return 'recovery_info';
  }

  get device() {
    return 'device';
  }

  get token() {
    return 'token';
  }

  get users() {
    return 'users';
  }

  get meta() {
    return 'meta';
  }

  get gifs() {
    return 'gifs';
  }
}

module.exports = new EntityType();

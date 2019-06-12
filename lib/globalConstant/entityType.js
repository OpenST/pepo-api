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

  get userListMeta() {
    return 'user_list_meta';
  }

  get gifs() {
    return 'gifs';
  }
}

module.exports = new EntityType();

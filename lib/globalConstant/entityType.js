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

  get feeds() {
    return 'feeds';
  }

  get userListMeta() {
    return 'user_list_meta';
  }

  get gifs() {
    return 'gifs';
  }

  get gifMap() {
    return 'gifMap';
  }

  get gifCategories() {
    return 'gifCategories';
  }

  get ostTransaction() {
    return 'transaction';
  }
}

module.exports = new EntityType();

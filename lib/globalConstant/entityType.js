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
    return 'recoveryInfo';
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
    return 'userListMeta';
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

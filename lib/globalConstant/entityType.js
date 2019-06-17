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

  get usersMap() {
    return 'usersMap';
  }

  get feed() {
    return 'feed';
  }

  get feedMap() {
    return 'feedMap';
  }

  get feedList() {
    return 'feedList';
  }

  get userListMeta() {
    return 'userListMeta';
  }

  get feedListMeta() {
    return 'feedListMeta';
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

  get gifsSearchMeta() {
    return 'gifsSearchMeta';
  }

  get ostTransaction() {
    return 'ostTransaction';
  }

  get ostTransactionMap() {
    return 'transactionMap';
  }

  get externalEntityGifMap() {
    return 'externalEntityGifMap';
  }

  get userFeedList() {
    return 'userFeedList';
  }
}

module.exports = new EntityType();

class ResponseEntityKey {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {}

  get loggedInUser() {
    return 'logged_in_user';
  }

  get gifs() {
    return 'gifs';
  }

  get gifCategories() {
    return 'gif_categories';
  }

  get token() {
    return 'token';
  }

  get device() {
    return 'device';
  }

  get recoveryInfo() {
    return 'recovery_info';
  }

  get users() {
    return 'users';
  }

  get meta() {
    return 'meta';
  }

  get ostTransaction() {
    return 'ost_transaction';
  }

  get publicFeed() {
    return 'public_feed';
  }

  get userFeed() {
    return 'user_feed';
  }

  get uploadParams() {
    return 'upload_params';
  }
}

module.exports = new ResponseEntityKey();

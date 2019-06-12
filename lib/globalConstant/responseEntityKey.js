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
}

module.exports = new ResponseEntityKey();

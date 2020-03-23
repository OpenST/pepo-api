const rootPrefix = '../..',
  jwtHelper = require(rootPrefix + '/lib/zoom/jwtHelper');

class ZoomUser {
  constructor() {}

  /**
   * Get all users
   *
   * @returns {Promise<void>}
   */
  async getAll() {
    const users = jwtHelper.getApi(
      "users",
      {}
    );

    return users;
  }
}

module.exports = new ZoomUser();

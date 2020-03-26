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

  /**
   * Get by user id
   *
   * @param userId
   * @returns {Promise<void>}
   */
  async getBy(userId) {
    const user = jwtHelper.getApi(
      "users/"+userId,
      {}
    );

    return user;
  }

}

module.exports = new ZoomUser();

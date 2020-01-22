/**
 * Class for webhook event user entity formatter.
 *
 * @class User
 */
class User {
  /**
   * Constructor for webhook event user entity formatter.
   *
   * @param {object} params
   * @param {array<number>} params.userIds
   * @param {object} params.users
   * @param {object} params.images
   * @param {object} params.tokenUsers
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
    oThis.users = params.users;
    oThis.images = params.images;
    oThis.tokenUsers = params.tokenUsers;
  }

  /**
   * Main performer for class.
   *
   * @returns {{}}
   */
  perform() {
    const oThis = this;

    const finalResponse = {};

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];
      finalResponse[userId] = {
        id: userId,
        name: '',
        profile_image: '',
        tokenholder_address: '',
        twitter_handle: '',
        github_login: ''
      };

      const userData = oThis.users[userId];
      const profileImageId = userData.profileImageId;
      const tokenUserInfo = oThis.tokenUsers[userId];

      finalResponse[userId].name = userData.name;
      finalResponse[userId].tokenholder_address = tokenUserInfo.ostTokenHolderAddress;

      if (profileImageId) {
        const profileImageInfo = oThis.images[profileImageId];
        finalResponse[userId].profile_image = profileImageInfo.resolutions.original.url;
      }
    }

    return finalResponse;
  }
}

module.exports = User;

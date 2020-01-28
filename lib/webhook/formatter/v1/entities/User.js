const rootPrefix = '../../../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common');

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
   * @param {object} params.githubUsersByUserIdMap
   * @param {object} params.twitterUsersByUserIdMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
    oThis.users = params.users;
    oThis.images = params.images;
    oThis.tokenUsers = params.tokenUsers;
    oThis.githubUsersByUserIdMap = params.githubUsersByUserIdMap;
    oThis.twitterUsersByUserIdMap = params.twitterUsersByUserIdMap;
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
        name: null,
        profile_image: null,
        tokenholder_address: null,
        twitter_handle: null,
        github_login: null
      };

      const userData = oThis.users[userId];
      const profileImageId = userData.profileImageId;
      const tokenUserInfo = oThis.tokenUsers[userId];
      const githubUser = oThis.githubUsersByUserIdMap[userId];
      const twitterUser = oThis.twitterUsersByUserIdMap[userId];

      if (CommonValidators.validateNonEmptyObject(githubUser)) {
        finalResponse[userId].github_login = githubUser.userName ? githubUser.userName : null;
      }

      if (CommonValidators.validateNonEmptyObject(twitterUser)) {
        finalResponse[userId].twitter_handle = twitterUser.handle ? twitterUser.handle : null;
      }

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

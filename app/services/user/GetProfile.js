const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get');

/**
 * Class for user profile get
 *
 * @class
 */
class GetUserProfile extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   * @param params.profile_user_id {String} - Profile user id
   * @param params.current_user {object} - current_user
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.profileUserId = +params.profile_user_id;
    oThis.currentUserId = +params.current_user.id;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    return oThis._fetchProfileDetails();
  }

  /**
   * Fetch profile details
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileDetails() {
    const oThis = this;

    let getProfileObj = new GetProfile({ userIds: [oThis.profileUserId], currentUserId: oThis.currentUserId });

    let response = await getProfileObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }
    let profileResp = response.data;

    return responseHelper.successWithData({
      userProfile: profileResp.userProfilesMap[oThis.profileUserId],
      userProfileAllowedActions: profileResp.userProfileAllowedActions[oThis.profileUserId],
      usersByIdMap: profileResp.usersByIdMap,
      tokenUsersByUserIdMap: profileResp.tokenUsersByUserIdMap,
      imageMap: profileResp.imageMap,
      videoMap: profileResp.videoMap,
      linkMap: profileResp.linkMap,
      tags: profileResp.tags,
      userStat: profileResp.userStat,
      videoDetailsMap: profileResp.videoDetailsMap,
      currentUserUserContributionsMap: profileResp.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: profileResp.currentUserVideoContributionsMap,
      pricePointsMap: profileResp.pricePointsMap
    });
  }
}

module.exports = GetUserProfile;

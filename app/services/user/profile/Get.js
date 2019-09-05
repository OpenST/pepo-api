const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to get user profile.
 *
 * @class GetUserProfile
 */
class GetUserProfile extends ServiceBase {
  /**
   * Constructor to get user profile.
   *
   * @param {object} params
   * @param {string/number} params.profile_user_id
   * @param {object} params.current_user
   * @param {string/number} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.profileUserId = +params.profile_user_id;
    oThis.currentUserId = +params.current_user.id;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    return oThis._fetchProfileDetails();
  }

  /**
   * Fetch profile details.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileDetails() {
    const oThis = this;

    const getProfileObj = new GetProfile({ userIds: [oThis.profileUserId], currentUserId: oThis.currentUserId });

    const response = await getProfileObj.perform();

    if (response.isFailure() || !CommonValidators.validateNonEmptyObject(response.data.userProfilesMap)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_g_1',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_inactive'],
          debug_options: {}
        })
      );
    }

    const profileResp = response.data;

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
      videoDescriptionsMap: profileResp.videoDescriptionMap,
      currentUserUserContributionsMap: profileResp.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: profileResp.currentUserVideoContributionsMap,
      pricePointsMap: profileResp.pricePointsMap
    });
  }
}

module.exports = GetUserProfile;

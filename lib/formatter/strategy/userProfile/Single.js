const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * User profile entity formatter.
 *
 * @class
 */
class UserProfile extends BaseFormatter {
  /**
   * Constructor for get UserProfile Details formatter.
   *
   * @param {object} params
   * @param {object} params.userProfile
   *
   * @param {number} params.userProfile.id
   * @param {number} params.userProfile.userId
   * @param {string} params.userProfile.bio
   * @param {array} params.userProfile.linkIds
   * @param {number} params.userProfile.coverVideoId
   * @param {number} params.userProfile.coverImageId
   * @param {number} params.userProfile.createdAt
   * @param {number} params.userProfile.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userProfile = params.userProfile;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userProfileKeyConfig = {
      id: { isNullAllowed: false },
      userId: { isNullAllowed: false },
      bio: { isNullAllowed: true },
      linkIds: { isNullAllowed: true },
      coverVideoId: { isNullAllowed: true },
      coverImageId: { isNullAllowed: true },
      updatedAt: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.userProfile, userProfileKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: Number(oThis.userProfile.id),
      user_id: Number(oThis.userProfile.userId),
      bio: oThis.userProfile.bio,
      link_ids: oThis.userProfile.linkIds,
      cover_video_id: Number(oThis.userProfile.coverVideoId),
      cover_image_id: Number(oThis.userProfile.coverImageId),
      uts: Number(oThis.userProfile.updatedAt)
    });
  }
}

module.exports = UserProfile;

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for get UserProfile Details formatter.
 *
 * @class Token
 */
class UserProfile extends BaseFormatter {
  /**
   * Constructor for get UserProfile Details formatter.
   *
   * @param {object} params
   * @param {object} params.UserProfileDetails
   *
   * @param {number} params.UserProfileDetails.id
   * @param {number} params.UserProfileDetails.userId
   * @param {string} params.UserProfileDetails.bio
   * @param {array} params.UserProfileDetails.linkIds
   * @param {number} params.UserProfileDetails.coverVideoId
   * @param {number} params.UserProfileDetails.coverImageId
   * @param {number} params.UserProfileDetails.totalContributedBy
   * @param {number} params.UserProfileDetails.totalContributedTo
   * @param {number} params.UserProfileDetails.totalAmountRaisedInWei
   * @param {number} params.UserProfileDetails.currentUserContributionInWei
   * @param {number} params.UserProfileDetails.createdAt
   * @param {number} params.UserProfileDetails.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.UserProfileDetails = params.UserProfileDetails;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const UserProfileDetailsKeyConfig = {
      id: { isNullAllowed: false },
      userId: { isNullAllowed: false },
      bio: { isNullAllowed: true },
      linkIds: { isNullAllowed: true },
      coverVideoId: { isNullAllowed: true },
      coverImageId: { isNullAllowed: true },
      totalContributedBy: { isNullAllowed: false },
      totalContributedTo: { isNullAllowed: false },
      totalAmountRaisedInWei: { isNullAllowed: false },
      totalUserContributionInWei: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.UserProfileDetails, UserProfileDetailsKeyConfig);
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
      id: Number(oThis.UserProfileDetails.id),
      user_id: Number(oThis.UserProfileDetails.userId),
      bio: oThis.UserProfileDetails.bio,
      link_ids: oThis.UserProfileDetails.linkIds,
      cover_video_id: Number(oThis.UserProfileDetails.coverVideoId),
      cover_image_id: Number(oThis.UserProfileDetails.coverImageId),
      total_contributed_by: Number(oThis.UserProfileDetails.totalContributedBy),
      total_contributed_to: Number(oThis.UserProfileDetails.totalContributedTo),
      total_amount_raised_in_wei: Number(oThis.UserProfileDetails.totalAmountRaisedInWei),
      current_user_contributions_in_wei: Number(oThis.UserProfileDetails.currentUserContributionInWei),
      created_at: Number(oThis.UserProfileDetails.createdAt),
      updated_at: Number(oThis.UserProfileDetails.updatedAt)
    });
  }
}

module.exports = UserProfile;

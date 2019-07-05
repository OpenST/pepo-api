const rootPrefix = '../../..',
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
   * @param {object} params.userProfileDetails
   *
   * @param {number} params.userProfileDetails.id
   * @param {number} params.userProfileDetails.userId
   * @param {string} params.userProfileDetails.bio
   * @param {array} params.userProfileDetails.linkIds
   * @param {number} params.userProfileDetails.coverVideoId
   * @param {number} params.userProfileDetails.coverImageId
   * @param {number} params.userProfileDetails.totalContributedBy
   * @param {number} params.userProfileDetails.totalContributedTo
   * @param {number} params.userProfileDetails.totalAmountRaisedInWei
   * @param {number} params.userProfileDetails.currentUserContributionInWei
   * @param {number} params.userProfileDetails.createdAt
   * @param {number} params.userProfileDetails.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userProfileDetails = params.userProfileDetails;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userProfileDetailsKeyConfig = {
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

    return oThis._validateParameters(oThis.userProfileDetails, userProfileDetailsKeyConfig);
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
      id: Number(oThis.userProfileDetails.id),
      user_id: Number(oThis.userProfileDetails.userId),
      bio: oThis.userProfileDetails.bio,
      link_ids: oThis.userProfileDetails.linkIds,
      cover_video_id: Number(oThis.userProfileDetails.coverVideoId),
      cover_image_id: Number(oThis.userProfileDetails.coverImageId),
      total_contributed_by: Number(oThis.userProfileDetails.totalContributedBy),
      total_contributed_to: Number(oThis.userProfileDetails.totalContributedTo),
      total_amount_raised_in_wei: Number(oThis.userProfileDetails.totalAmountRaisedInWei),
      current_user_contributions_in_wei: Number(oThis.userProfileDetails.currentUserContributionInWei),
      created_at: Number(oThis.userProfileDetails.createdAt),
      updated_at: Number(oThis.userProfileDetails.updatedAt)
    });
  }
}

module.exports = UserProfile;

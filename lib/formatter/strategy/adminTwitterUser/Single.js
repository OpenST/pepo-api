const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Twitter user entity formatter.
 *
 * @class
 */
class AdminTwitterUser extends BaseFormatter {
  /**
   * Constructor for get adminTwitterUser Details formatter.
   *
   * @param {object} params
   * @param {object} params.adminTwitterUser
   *
   * @param {number} params.adminTwitterUser.id
   * @param {number} params.adminTwitterUser.twitterId
   * @param {string} params.adminTwitterUser.email
   * @param {string} params.adminTwitterUser.handle
   * @param {string} params.adminTwitterUser.name
   * @param {number} params.adminTwitterUser.userId
   * @param {string} params.adminTwitterUser.profileImageUrl
   * @param {number} params.adminTwitterUser.createdAt
   * @param {number} params.adminTwitterUser.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.adminTwitterUser = params.adminTwitterUser;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const adminTwitterUserKeyConfig = {
      id: { isNullAllowed: false },
      twitterId: { isNullAllowed: false },
      email: { isNullAllowed: true },
      handle: { isNullAllowed: true },
      name: { isNullAllowed: false },
      userId: { isNullAllowed: true },
      profileImageUrl: { isNullAllowed: true },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.adminTwitterUser, adminTwitterUserKeyConfig);
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
      id: Number(oThis.adminTwitterUser.id),
      twitter_id: Number(oThis.adminTwitterUser.twitterId),
      email: oThis.adminTwitterUser.email,
      handle: oThis.adminTwitterUser.handle,
      name: oThis.adminTwitterUser.name,
      user_id: Number(oThis.adminTwitterUser.userId),
      profile_image_url: oThis.adminTwitterUser.profileImageUrl,
      uts: Number(oThis.adminTwitterUser.updatedAt)
    });
  }
}

module.exports = AdminTwitterUser;

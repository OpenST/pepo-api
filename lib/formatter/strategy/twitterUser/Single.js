const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Twitter user entity formatter.
 *
 * @class
 */
class TwitterUser extends BaseFormatter {
  /**
   * Constructor for get twitterUser Details formatter.
   *
   * @param {object} params
   * @param {object} params.twitterUser
   *
   * @param {number} params.twitterUser.id
   * @param {number} params.twitterUser.twitterId
   * @param {string} params.twitterUser.email
   * @param {string} params.twitterUser.handle
   * @param {string} params.twitterUser.name
   * @param {number} params.twitterUser.userId
   * @param {string} params.twitterUser.profileImageUrl
   * @param {number} params.twitterUser.createdAt
   * @param {number} params.twitterUser.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.twitterUser = params.twitterUser;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const twitterUserKeyConfig = {
      id: { isNullAllowed: false },
      handle: { isNullAllowed: true },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.twitterUser, twitterUserKeyConfig);
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
      id: Number(oThis.twitterUser.userId),
      handle: oThis.twitterUser.handle,
      uts: Number(oThis.twitterUser.updatedAt)
    });
  }
}

module.exports = TwitterUser;

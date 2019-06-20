const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  SingleFeedFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Single User Feed entity to convert keys to snake case.
 *
 * @class UserFeedSingleFormatter
 */
class UserFeedSingleFormatter extends BaseFormatter {
  /**
   * Constructor for Single User Feed entity to convert keys to snake case.
   *
   * @param {object} params
   *
   * @param {object} params.feed
   * @param {number} params.feed.id
   * @param {string} params.feed.kind
   * @param {string} params.feed.status
   * @param {number} params.feed.display_ts
   * @param {number} params.feed.updated_at
   * @param {object} params.feed.payload
   *
   * @param {object} params.userFeed
   * @param {object} params.userFeed.privacyType
   * @param {object} params.userFeed.publishedTs
   * @param {object} params.userFeed.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.feed = params.feed;
    oThis.userFeed = params.userFeed;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userFeedKeyConfig = {
      privacyType: { isNullAllowed: false },
      publishedTs: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.userFeed, userFeedKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    const formattedFeedDataResp = new SingleFeedFormatter({ feed: oThis.feed }).perform();

    if (formattedFeedDataResp.isFailure()) {
      return formattedFeedDataResp;
    }

    const formattedFeedData = formattedFeedDataResp.data;

    formattedFeedData.privacy_type = oThis.userFeed.privacyType;
    formattedFeedData.display_ts = oThis.userFeed.publishedTs;
    formattedFeedData.updated_at = oThis.userFeed.updatedAt;

    return responseHelper.successWithData(formattedFeedData);
  }
}

module.exports = UserFeedSingleFormatter;

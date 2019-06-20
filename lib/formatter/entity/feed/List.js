const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  FeedSingleFormatter = require(rootPrefix + '/lib/formatter/entity/feed/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feeds list formatter.
 *
 * @class FeedsListFormatter
 */
class FeedsListFormatter extends BaseFormatter {
  /**
   * Constructor for feeds list formatter.
   *
   * @param {object} params
   * @param {array} params.feedIds
   * @param {object} params.feedIdToFeedDetailsMap
   *
   * @param {number} params.feeds.id
   * @param {string} params.feeds.kind
   * @param {string} params.feeds.status
   * @param {number} params.feeds.published_ts
   * @param {number} params.feeds.updated_at
   * @param {object} params.feeds.payload
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.feedIds = params.feedIds;
    oThis.feedIdToFeedDetailsMap = params.feedIdToFeedDetailsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.feedIds)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_f_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {}
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = [];

    for (let index = 0; index < oThis.feedIds.length; index++) {
      const feedId = oThis.feedIds[index],
        feedObj = oThis.feedIdToFeedDetailsMap[feedId];

      const formattedFeedRsp = new FeedSingleFormatter({ feed: feedObj }).perform();

      if (formattedFeedRsp.isFailure()) return formattedFeedRsp;

      finalResponse.push(formattedFeedRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = FeedsListFormatter;

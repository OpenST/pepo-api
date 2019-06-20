const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  FeedSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feeds map formatter.
 *
 * @class FeedsMapFormatter
 */
class FeedsMapFormatter extends BaseFormatter {
  /**
   * Constructor for feeds map formatter.
   *
   * @param {object} params
   * @param {object} params.feedMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.feedMap = params.feedMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.feedMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_f_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {}
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = {};

    for (const feedId in oThis.feedMap) {
      const feedObj = oThis.feedMap[feedId],
        formattedFeedRsp = new FeedSingleFormatter({ feed: feedObj }).perform();

      if (formattedFeedRsp.isFailure()) {
        return formattedFeedRsp;
      }

      finalResponse[feedId] = formattedFeedRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = FeedsMapFormatter;

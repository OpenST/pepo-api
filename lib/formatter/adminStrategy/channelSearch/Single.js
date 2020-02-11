const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel search result formatter.
 *
 * @class ChannelSearchSingleFormatter
 */
class ChannelSearchSingleFormatter extends BaseFormatter {
  /**
   * Constructor for channel search result formatter.
   *
   * @param {object} params
   * @param {object} params.channelSearchResult
   *
   * @param {number} params.channelSearchResult.id
   * @param {number} params.channelSearchResult.updatedAt
   * @param {object} params.channelSearchResult.payload
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelSearchResult = params.channelSearchResult;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const channelSearchKeyConfig = {
      id: { isNullAllowed: false },
      name: { isNullAllowed: false },
      status: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.channelSearchResult, channelSearchKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    const response = {
      id: oThis.channelSearchResult.id,
      name: oThis.channelSearchResult.name,
      status: oThis.channelSearchResult.status,
      uts: oThis.channelSearchResult.updatedAt
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = ChannelSearchSingleFormatter;

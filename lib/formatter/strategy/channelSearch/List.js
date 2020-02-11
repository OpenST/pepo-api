const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelSearchSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channelSearch/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class for channel search list formatter.
 *
 * @class ChannelSearchListFormatter
 */
class ChannelSearchListFormatter extends BaseFormatter {
  /**
   * Constructor for channel search list formatter.
   *
   * @param {object} params
   * @param {array} params.channelSearchList
   *
   * @param {number} params.channelSearchList.id
   * @param {string} params.channelSearchList.name
   * @param {string} params.channelSearchList.status
   * @param {number} params.channelSearchList.updated_at
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis[entityTypeConstants.channelSearchList] = params[entityTypeConstants.channelSearchList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis[entityTypeConstants.channelSearchList])) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_csr_l_1',
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

    const finalResponse = [];

    for (let index = 0; index < oThis[entityTypeConstants.channelSearchList].length; index++) {
      const formattedFeedRsp = new ChannelSearchSingleFormatter({
        channelSearchResult: oThis[entityTypeConstants.channelSearchList][index]
      }).perform();

      if (formattedFeedRsp.isFailure()) {
        return formattedFeedRsp;
      }

      finalResponse.push(formattedFeedRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelSearchListFormatter;

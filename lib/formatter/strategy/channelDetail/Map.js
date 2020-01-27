const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelDetailSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channelDetail/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel detail map formatter.
 *
 * @class ChannelDetailMapFormatter
 */
class ChannelDetailMapFormatter extends BaseFormatter {
  /**
   * Constructor for channel detail map formatter.
   *
   * @param {object} params
   * @param {object} params.channelDetailsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelDetailsMap = params.channelDetailsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.channelDetailsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_cd_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { channelDetailsMap: oThis.channelDetailsMap }
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

    for (const channelId in oThis.channelDetailsMap) {
      const channelDetailObj = oThis.channelDetailsMap[channelId],
        formattedChannel = new ChannelDetailSingleFormatter({ channelDetail: channelDetailObj }).perform();

      if (formattedChannel.isFailure()) {
        return formattedChannel;
      }

      finalResponse[channelId] = formattedChannel.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelDetailMapFormatter;

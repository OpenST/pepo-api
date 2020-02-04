const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelStatSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channelStat/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel stat map formatter.
 *
 * @class ChannelStatMapFormatter
 */
class ChannelStatMapFormatter extends BaseFormatter {
  /**
   * Constructor for channel stat map formatter.
   *
   * @param {object} params
   * @param {object} params.channelStatsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelStatsMap = params.channelStatsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.channelStatsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_cs_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { channelStatsMap: oThis.channelStatsMap }
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

    for (const channelId in oThis.channelStatsMap) {
      const channelStatObj = oThis.channelStatsMap[channelId],
        formattedChannel = new ChannelStatSingleFormatter({ channelStat: channelStatObj }).perform();

      if (formattedChannel.isFailure()) {
        return formattedChannel;
      }

      finalResponse[channelId] = formattedChannel.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelStatMapFormatter;

const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelStatSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channelStat/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel stat list formatter.
 *
 * @class ChannelStatListFormatter
 */
class ChannelStatListFormatter extends BaseFormatter {
  /**
   * Constructor for channel stat list formatter.
   *
   * @param {object} params
   * @param {array} params.channelIds
   * @param {object} params.channelStatsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelIds = params.channelIds;
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

    if (!CommonValidators.validateArray(oThis.channelIds)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_cs_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { array: oThis.channelIds }
      });
    }

    if (!CommonValidators.validateObject(oThis.channelStatsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_cs_l_2',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { object: oThis.channelStatsMap }
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

    for (let index = 0; index < oThis.channelIds.length; index++) {
      const channelId = oThis.channelIds[index],
        channelStat = oThis.channelStatsMap[channelId];

      const formattedChannel = new ChannelStatSingleFormatter({ channel: channelStat }).perform();

      if (formattedChannel.isFailure()) {
        return formattedChannel;
      }

      finalResponse.push(formattedChannel.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelStatListFormatter;

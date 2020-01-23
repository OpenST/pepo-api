const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channel/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel list formatter.
 *
 * @class ChannelListFormatter
 */
class ChannelListFormatter extends BaseFormatter {
  /**
   * Constructor for channel list formatter.
   *
   * @param {object} params
   * @param {array} params.channelIds
   * @param {object} params.channelsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelIds = params.channelIds;
    oThis.channelsMap = params.channelsMap;
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
        internal_error_identifier: 'l_f_s_c_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { array: oThis.channelIds }
      });
    }

    if (!CommonValidators.validateObject(oThis.channelsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_c_l_2',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { object: oThis.channelsMap }
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
        channel = oThis.channelsMap[channelId];

      const formattedChannel = new ChannelSingleFormatter({ channel: channel }).perform();

      if (formattedChannel.isFailure()) {
        return formattedChannel;
      }

      finalResponse.push(formattedChannel.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelListFormatter;

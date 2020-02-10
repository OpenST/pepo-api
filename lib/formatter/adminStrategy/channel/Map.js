const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channel/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel map formatter.
 *
 * @class ChannelMapFormatter
 */
class ChannelMapFormatter extends BaseFormatter {
  /**
   * Constructor for channel map formatter.
   *
   * @param {object} params
   * @param {object} params.channelsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

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

    if (!CommonValidators.validateObject(oThis.channelsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_c_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { channelsMap: oThis.channelsMap }
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

    for (const id in oThis.channelsMap) {
      const channelObj = oThis.channelsMap[id],
        formattedChannel = new ChannelSingleFormatter({ channel: channelObj }).perform();

      if (formattedChannel.isFailure()) {
        return formattedChannel;
      }

      finalResponse[id] = formattedChannel.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelMapFormatter;

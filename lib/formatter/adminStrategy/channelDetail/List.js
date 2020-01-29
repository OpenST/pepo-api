const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelDetailSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channelDetail/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel detail list formatter.
 *
 * @class ChannelDetailListFormatter
 */
class ChannelDetailListFormatter extends BaseFormatter {
  /**
   * Constructor for channel detail list formatter.
   *
   * @param {object} params
   * @param {array} params.channelIds
   * @param {object} params.channelDetailsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelIds = params.channelIds;
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

    if (!CommonValidators.validateArray(oThis.channelIds)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_cd_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { array: oThis.channelIds }
      });
    }

    if (!CommonValidators.validateObject(oThis.channelDetailsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_cd_l_2',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { object: oThis.channelDetailsMap }
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
        channelDetailObj = oThis.channelDetailsMap[channelId];

      const formattedChannel = new ChannelDetailSingleFormatter({ channelDetail: channelDetailObj }).perform();

      if (formattedChannel.isFailure()) {
        return formattedChannel;
      }

      finalResponse.push(formattedChannel.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelDetailListFormatter;

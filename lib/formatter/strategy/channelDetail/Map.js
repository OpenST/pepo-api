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
   * @param {object} params.channelIdToTagIdsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelDetailsMap = params.channelDetailsMap;
    oThis.channelIdToTagIdsMap = params.channelIdToTagIdsMap;
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

    if (!CommonValidators.validateObject(oThis.channelIdToTagIdsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_cd_m_2',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { channelIdToTagIdsMap: oThis.channelIdToTagIdsMap }
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
      const formattedChannelResponse = new ChannelDetailSingleFormatter({
        channelDetail: oThis.channelDetailsMap[channelId],
        tagIds: oThis.channelIdToTagIdsMap[channelId]
      }).perform();

      if (formattedChannelResponse.isFailure()) {
        return formattedChannelResponse;
      }

      finalResponse[channelId] = formattedChannelResponse.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelDetailMapFormatter;

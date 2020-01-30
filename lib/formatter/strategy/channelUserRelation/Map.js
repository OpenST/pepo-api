const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelUserRelationsSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channelUserRelation/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for current user channel relation map formatter.
 *
 * @class ChannelUserRelationMapFormatter
 */
class ChannelUserRelationMapFormatter extends BaseFormatter {
  /**
   * Constructor for channel user relations map formatter.
   *
   * @param {object} params
   * @param {object} params.channelUserRelationMap
   * @param {array} params.userIds
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelUserRelationMap = params.channelUserRelationMap;
    oThis.userIds = params.userIds;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.channelUserRelationMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_cur_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { object: oThis.channelUserRelationMap }
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

    for (const channelId in oThis.channelUserRelationMap) {
      finalResponse[channelId] = {};
      for (let index = 0; index < oThis.userIds.length; index++) {
        const userId = oThis.userIds[index],
          channelUserRelation = oThis.channelUserRelationMap[channelId][userId],
          formattedRelationRsp = new ChannelUserRelationsSingleFormatter({
            channelUserRelation: channelUserRelation
          }).perform();

        if (formattedRelationRsp.isFailure()) {
          return formattedRelationRsp;
        }

        finalResponse[channelId][userId] = formattedRelationRsp.data;
      }
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelUserRelationMapFormatter;

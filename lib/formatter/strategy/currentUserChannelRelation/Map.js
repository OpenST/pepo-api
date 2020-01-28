const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  CurrentUserReplyChannelRelationsSingleFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserChannelRelation/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for current user channel relation map formatter.
 *
 * @class CurrentUserChannelRelationMapFormatter
 */
class CurrentUserChannelRelationMapFormatter extends BaseFormatter {
  /**
   * Constructor for current user channel relations map formatter.
   *
   * @param {object} params
   * @param {object} params.currentUserChannelRelationsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserChannelRelationsMap = params.currentUserChannelRelationsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.currentUserChannelRelationsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_cucr_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { object: oThis.currentUserChannelRelationsMap }
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

    for (const channelId in oThis.currentUserChannelRelationsMap) {
      const currentUserChannelRelation = oThis.currentUserChannelRelationsMap[channelId],
        formattedRelationRsp = new CurrentUserReplyChannelRelationsSingleFormatter({
          currentUserChannelRelation: currentUserChannelRelation
        }).perform();

      if (formattedRelationRsp.isFailure()) {
        return formattedRelationRsp;
      }

      finalResponse[channelId] = formattedRelationRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = CurrentUserChannelRelationMapFormatter;

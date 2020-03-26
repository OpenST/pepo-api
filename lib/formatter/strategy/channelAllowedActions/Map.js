const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  ChannelAllowedActionSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channelAllowedActions/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Channel Allowed Action map formatter.
 *
 * @class ChannelAllowedActionMapFormatter
 */
class ChannelAllowedActionMapFormatter extends BaseFormatter {
  /**
   * Constructor for Channel Allowed Actions map formatter.
   *
   * @param {object} params
   * @param {object} params.channelAllowedActionsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelAllowedActionsMap = params[entityTypeConstants.channelAllowedActionsMap];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.channelAllowedActionsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_caa_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { object: oThis.channelAllowedActionsMap }
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

    for (const channelId in oThis.channelAllowedActionsMap) {
      const channelAllowedAction = oThis.channelAllowedActionsMap[channelId],
        formattedActionsRsp = new ChannelAllowedActionSingleFormatter({
          channelAllowedAction: channelAllowedAction
        }).perform();

      if (formattedActionsRsp.isFailure()) {
        return formattedActionsRsp;
      }

      finalResponse[channelId] = formattedActionsRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelAllowedActionMapFormatter;

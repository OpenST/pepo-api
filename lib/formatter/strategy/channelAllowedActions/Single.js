const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Channel Allowed Action formatter.
 *
 * @class ChannelAllowedActionSingleFormatter
 */
class ChannelAllowedActionSingleFormatter extends BaseFormatter {
  /**
   * Constructor for Channel Allowed Action formatter.
   *
   * @param {object} params
   * @param {object} params.channelAllowedAction
   * @param {number} params.channelAllowedAction.id
   * @param {number} params.channelAllowedAction.canStartMeeting
   * @param {number} params.channelAllowedAction.canJoinMeeting
   * @param {number} params.channelAllowedAction.canEdit
   * @param {number} params.channelAllowedAction.canLeave
   * @param {number} params.channelAllowedAction.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelAllowedAction = params.channelAllowedAction;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const entityConfig = {
      id: { isNullAllowed: false },
      canEdit: { isNullAllowed: false },
      canLeave: { isNullAllowed: false },
      canJoinMeeting: { isNullAllowed: false },
      canStartMeeting: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.channelAllowedAction, entityConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.channelAllowedAction.id,
      can_edit: Number(oThis.channelAllowedAction.canEdit),
      can_leave: Number(oThis.channelAllowedAction.canLeave),
      can_join_meeting: Number(oThis.channelAllowedAction.canJoinMeeting),
      can_start_meeting: Number(oThis.channelAllowedAction.canStartMeeting),
      uts: oThis.channelAllowedAction.updatedAt
    });
  }
}

module.exports = ChannelAllowedActionSingleFormatter;

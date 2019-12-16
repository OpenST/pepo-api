const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user allowed action single formatter.
 *
 * @class UserAllowedActionSingleFormatter
 */
class UserAllowedActionSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get Video Details formatter.
   *
   * @param {object} params
   * @param {object} params.userAllowedAction
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userAllowedAction = params.userAllowedAction;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userAllowedActionKeyConfig = {
      canEdit: { isNullAllowed: true },
      canBlock: { isNullAllowed: false },
      canUnblock: { isNullAllowed: false },
      canReport: { isNullAllowed: false },
      canMute: { isNullAllowed: false },
      canUnmute: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.userAllowedAction, userAllowedActionKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      can_edit: oThis.userAllowedAction.canEdit,
      can_block: oThis.userAllowedAction.canBlock,
      can_unblock: oThis.userAllowedAction.canUnblock,
      can_report: oThis.userAllowedAction.canReport,
      can_mute: oThis.userAllowedAction.canMute,
      can_unmute: oThis.userAllowedAction.canUnmute
    });
  }
}

module.exports = UserAllowedActionSingleFormatter;

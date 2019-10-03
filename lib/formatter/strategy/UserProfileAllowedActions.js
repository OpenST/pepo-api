const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user profile allowed actions formatter.
 *
 * @class UserProfileAllowedActionsFormatter
 */
class UserProfileAllowedActionsFormatter extends BaseFormatter {
  /**
   * Constructor for user profile allowed actions formatter.
   *
   * @param {object} params
   * @param {object} params.userProfileAllowedActions
   *
   * @param {string} params.userProfileAllowedActions.editProfile
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userProfileAllowedActions = params.userProfileAllowedActions;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const userProfileAllowedActionsKeyConfig = {
      editProfile: { isNullAllowed: false },
      blockedRelations: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.userProfileAllowedActions, userProfileAllowedActionsKeyConfig);
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
      edit_profile: oThis.userProfileAllowedActions.editProfile,
      blocked_relations: oThis.userProfileAllowedActions.blockedRelations
    });
  }
}

module.exports = UserProfileAllowedActionsFormatter;

const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  InviteUserSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/invites/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for invite user map formatter.
 *
 * @class InviteUserMapFormatter
 */
class InviteUserMapFormatter extends BaseFormatter {
  /**
   * Constructor for invite user map formatter.
   *
   * @param {object} params
   * @param {object} params.inviteMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.inviteMap = params.inviteMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.inviteMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_i_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {
          object: oThis.inviteMap
        }
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

    for (const id in oThis.inviteMap) {
      const inviteUserObj = oThis.inviteMap[id];

      const formattedInviteUser = new InviteUserSingleFormatter({ inviteUser: inviteUserObj }).perform();

      if (formattedInviteUser.isFailure()) {
        return formattedInviteUser;
      }

      finalResponse[id] = formattedInviteUser.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = InviteUserMapFormatter;

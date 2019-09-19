const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  InviteCodeSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/inviteCode/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for invite user map formatter.
 *
 * @class InviteCodesMapFormatter
 */
class InviteCodesMapFormatter extends BaseFormatter {
  /**
   * Constructor for invite user map formatter.
   *
   * @param {object} params
   * @param {object} params.inviteCodesMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.inviteCodesMap = params.inviteCodesMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.inviteCodesMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_ic_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {
          object: oThis.inviteCodesMap
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

    for (const id in oThis.inviteCodesMap) {
      const formattedInviteUser = new InviteCodeSingleFormatter({ inviteCode: oThis.inviteCodesMap[id] }).perform();

      if (formattedInviteUser.isFailure()) {
        return formattedInviteUser;
      }

      finalResponse[id] = formattedInviteUser.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = InviteCodesMapFormatter;

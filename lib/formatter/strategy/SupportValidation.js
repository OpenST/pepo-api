const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for support validation formatter.
 *
 * @class SupportValidation
 */
class SupportValidation extends BaseFormatter {
  /**
   * Constructor for support validation formatter.
   *
   * @param {object} params
   * @param {object} params.supportValidation
   * @param {number} params.supportValidation.userId
   * @param {string} params.supportValidation.externalUserId
   * @param {object} params.supportValidation.userName
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.supportValidation = params.supportValidation;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const supportValidationConfig = {
      userId: { isNullAllowed: false },
      externalUserId: { isNullAllowed: false },
      userName: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.supportValidation, supportValidationConfig);
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
      userId: oThis.supportValidation.userId,
      external_user_id: oThis.supportValidation.externalUserId,
      user_name: oThis.supportValidation.userName
    });
  }
}

module.exports = SupportValidation;

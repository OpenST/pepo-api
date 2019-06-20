/**
 * Formatter for recovery info entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/RecoveryInfo
 */

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for recovery info formatter.
 *
 * @class RecoveryInfo
 */
class RecoveryInfo extends BaseFormatter {
  /**
   * Constructor for recovery info formatter.
   *
   * @param {object} params
   * @param {string} params.scryptSalt: scrypt salt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.scryptSalt = params.scryptSalt;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   */
  validate() {
    const oThis = this;

    const recoveryInfoKeyConfig = { scryptSalt: { isNullAllowed: false } };

    return oThis._validateParameters({ scryptSalt: oThis.scryptSalt }, recoveryInfoKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object|result}
   */
  format() {
    const oThis = this;

    const validationResponse = oThis.validate();

    if (validationResponse.isFailure()) {
      return validationResponse;
    }

    return responseHelper.successWithData({
      scrypt_salt: oThis.scryptSalt
    });
  }
}

module.exports = RecoveryInfo;

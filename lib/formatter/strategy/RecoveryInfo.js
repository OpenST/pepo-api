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
   * @private
   */
  _validate() {
    const oThis = this;

    const recoveryInfoKeyConfig = { scryptSalt: { isNullAllowed: false } };

    return oThis._validateParameters({ scryptSalt: oThis.scryptSalt }, recoveryInfoKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      scrypt_salt: oThis.scryptSalt
    });
  }
}

module.exports = RecoveryInfo;

/**
 * Formatter for recovery info entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/RecoveryInfo
 */

const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for recovery info formatter.
 *
 * @class
 */
class RecoveryInfo {
  /**
   * Constructor for recovery info formatter.
   *
   * @param {Object} params
   * @param {String} params.scryptSalt - scrypt salt
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.params = params;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const formattedData = {
      scrypt_salt: oThis.params.scryptSalt
    };

    return responseHelper.successWithData(formattedData);
  }
}

module.exports = RecoveryInfo;

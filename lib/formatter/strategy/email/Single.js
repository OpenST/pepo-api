const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for get email single formatter.
 *
 * @class EmailSingleFormatter
 */
class EmailSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get email single formatter.
   *
   * @param {object} params
   * @param {object} params.email
   *
   * @param {number} params.email.address
   * @param {object} params.email.verified
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.email = params.email;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const emailKeyConfig = {
      address: { isNullAllowed: true },
      verified: { isNullAllowed: true }
    };

    return oThis.validateParameters(oThis.email, emailKeyConfig);
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
      address: oThis.email.address || '',
      verified: oThis.email.verified || false
    });
  }
}

module.exports = EmailSingleFormatter;

const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for support info formatter.
 *
 * @class SupportInfo
 */
class SupportInfo extends BaseFormatter {
  /**
   * Constructor for supportInfo info formatter.
   *
   * @param {object} params
   * @param {object} params.supportInfo
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.supportInfo = params.supportInfo;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const supportInfoInfoKeyConfig = {
      id: { isNullAllowed: false },
      url: { isNullAllowed: false },
      uts: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.supportInfo, supportInfoInfoKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData(oThis.supportInfo);
  }
}

module.exports = SupportInfo;

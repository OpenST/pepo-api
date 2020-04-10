const rootPrefix = '../../../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for sending Pepo's twitter details formatter.
 *
 * @class PepoTwitterDetailsFormatter
 */
class PepoTwitterDetailsFormatter extends BaseFormatter {
  /**
   * Constructor for sending Pepo's twitter details.
   *
   * @param {object} params
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      handle: coreConstants.PEPO_TWITTER_HANDLE
    });
  }
}

module.exports = PepoTwitterDetailsFormatter;

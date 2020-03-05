const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for default formatter.
 *
 * @class DefaultFormatter
 */
class DefaultFormatter extends BaseFormatter {
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
   * @returns {object|result}
   */
  _format() {
    return responseHelper.successWithData({});
  }
}

module.exports = DefaultFormatter;

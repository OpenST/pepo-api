const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for text formatter.
 *
 * @class TextSingleFormatter
 */
class TextSingleFormatter extends BaseFormatter {
  /**
   * Constructor for text formatter.
   *
   * @param {object} params
   * @param {object} params.text
   * @param {string} params.text.text
   * @param {object} params.text.includes
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.text = params.text;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const entityConfig = {
      text: { isNullAllowed: false },
      includes: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.text, entityConfig);
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
      text: oThis.text.text,
      includes: oThis.text.includes
    });
  }
}

module.exports = TextSingleFormatter;

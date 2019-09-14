const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for fetch goto formatter.
 *
 * @class FetchGoto
 */
class FetchGoto extends BaseFormatter {
  /**
   * Constructor for device formatter.
   *
   * @param {object} params
   * @param {object} params.
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    console.log('params------', params);

    oThis.goto = params.goto;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const gotoConfig = {
      pn: { isNullAllowed: false },
      v: { isNullAllowed: true }
    };

    return oThis.validateParameters(oThis.goto, gotoConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    console.log('oThis.goto----', oThis.goto);

    return responseHelper.successWithData(oThis.goto);
  }
}

module.exports = FetchGoto;

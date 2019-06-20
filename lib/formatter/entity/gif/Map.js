const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GifSingleFormatter = require(rootPrefix + '/lib/formatter/entity/gif/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for gifs map formatter.
 *
 * @class
 */
class GifsMapFormatter extends BaseFormatter {
  /**
   * Constructor for gifs Map formatter.
   *
   * @param {object} params
   * @param {object} params.gifMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.gifMap = params.gifMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.gifMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_g_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {}
      });
    }

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

    const finalResponse = {};

    for (const gifId in oThis.gifMap) {
      const gifObj = oThis.gifMap[gifId];

      const formattedGifRsp = new GifSingleFormatter({ gif: gifObj }).perform();

      if (formattedGifRsp.isFailure()) return formattedGifRsp;

      finalResponse[gifId] = formattedGifRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = GifsMapFormatter;

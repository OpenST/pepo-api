const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GifSingleFormatter = require(rootPrefix + '/lib/formatter/entity/gif/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for gifs list formatter.
 *
 * @class
 */
class GifsListFormatter extends BaseFormatter {
  /**
   * Constructor for gifs list formatter.
   *
   * @param {Object} params
   * @param {Object} params.gifs
   *
   * @param {String} params.gifs.id
   * @param {String} params.gifs.kind
   * @param {Object} params.gifs.downsized
   * @param {Object} params.gifs.original
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.gifs = params.gifs;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.gifs)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_g_l_1',
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

    const finalResponse = [];

    for (let index = 0; index < oThis.gifs.length; index++) {
      const gifObj = oThis.gifs[index],
        formattedGifRsp = new GifSingleFormatter({ gif: gifObj }).perform();

      if (formattedGifRsp.isFailure()) return formattedGifRsp;

      finalResponse.push(formattedGifRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = GifsListFormatter;

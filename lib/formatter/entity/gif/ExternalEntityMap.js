const rootPrefix = '../../../..',
  GifMapFormatter = require(rootPrefix + '/lib/formatter/entity/gif/Map'),
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for external entity gifs Map formatter.
 *
 * @class ExternalEntityGifsMapFormatter
 */
class ExternalEntityGifsMapFormatter extends BaseFormatter {
  /**
   * Constructor for external entity gifs Map formatter.
   *
   * @param {object} params
   * @param {object} params.externalEntityGifMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.externalEntityGifMap = params.externalEntityGifMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    // if (!CommonValidators.validateObject(oThis.externalEntityGifMap)) {
    //   return responseHelper.error({
    //     internal_error_identifier: 'l_f_e_g_eem_1',
    //     api_error_identifier: 'entity_formatting_failed',
    //     debug_options: {}
    //   });
    // }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const gifMap = {};

    for (const externalEntityId in oThis.externalEntityGifMap) {
      const externalEntityObj = oThis.externalEntityGifMap[externalEntityId];

      gifMap[externalEntityObj.entityId] = externalEntityObj.extraData;
    }

    return new GifMapFormatter({ gifMap: gifMap }).perform();
  }
}

module.exports = ExternalEntityGifsMapFormatter;

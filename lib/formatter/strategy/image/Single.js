const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for get Image Details formatter.
 *
 * @class ImageSingleFormatter
 */
class ImageSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get Image Details formatter.
   *
   * @param {object} params
   * @param {object} params.image
   *
   * @param {number} params.image.id
   * @param {object} params.image.resolutions
   * @param {string} params.image.status
   * @param {number} params.image.createdAt
   * @param {number} params.image.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.image = params.image;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const imageKeyConfig = {
      id: { isNullAllowed: false },
      resolutions: { isNullAllowed: true },
      status: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.image, imageKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    for (let imageSize in oThis.image.resolutions) {
      let imageSizeResolution = oThis.image.resolutions[imageSize];
      imageSizeResolution.url = imageLib.getFullUrl({ shortUrl: imageSizeResolution.url });
      oThis.image.resolutions[imageSize] = imageSizeResolution;
    }

    return responseHelper.successWithData({
      id: Number(oThis.image.id),
      resolutions: oThis.image.resolutions,
      status: oThis.image.status,
      created_at: Number(oThis.image.createdAt),
      updated_at: Number(oThis.image.updatedAt)
    });
  }
}

module.exports = ImageSingleFormatter;

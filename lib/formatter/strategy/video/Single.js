const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for get Video Details formatter.
 *
 * @class VideoSingleFormatter
 */
class VideoSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get Video Details formatter.
   *
   * @param {object} params
   * @param {object} params.video
   * @param {object} [params.imageMap]
   *
   * @param {number} params.video.id
   * @param {object} params.video.resolutions
   * @param {string} params.video.status
   * @param {number} params.video.posterImageId
   * @param {number} params.video.createdAt
   * @param {number} params.video.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.video = params.video;
    oThis.imageMap = params.imageMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const videoKeyConfig = {
      id: { isNullAllowed: false },
      resolutions: { isNullAllowed: true },
      status: { isNullAllowed: false },
      posterImageId: { isNullAllowed: true },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    if (oThis.video.posterImageId) {
      oThis.validateParameters(oThis.video, videoKeyConfig);
      return oThis._validatePosterImage(oThis.video.posterImageId);
    }

    return oThis.validateParameters(oThis.video, videoKeyConfig);
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
      id: Number(oThis.video.id),
      resolutions: oThis.video.resolutions,
      status: oThis.video.status,
      poster_image_id: oThis.video.posterImageId,
      uts: Number(oThis.video.updatedAt)
    });
  }

  /**
   * Validate Poster Image
   *
   * @param posterImageId
   * @returns {*}
   * @private
   */
  _validatePosterImage(posterImageId) {
    const oThis = this;
    if (CommonValidators.isVarNullOrUndefined(oThis.imageMap[posterImageId])) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_v_s_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { posterImageId: posterImageId }
      });
    }
    return responseHelper.successWithData({});
  }
}

module.exports = VideoSingleFormatter;

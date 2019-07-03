const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
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
      posterImageId: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.video, videoKeyConfig);
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
      created_at: Number(oThis.video.createdAt),
      updated_at: Number(oThis.video.updatedAt)
    });
  }
}

module.exports = VideoSingleFormatter;

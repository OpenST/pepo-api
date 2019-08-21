const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * User profile entity formatter.
 *
 * @class
 */
class VideoDescription extends BaseFormatter {
  /**
   * Constructor for get VideoDescription Details formatter.
   *
   * @param {object} params
   * @param {object} params.videoDescription
   *
   * @param {number} params.videoDescription.text
   * @param {number} params.videoDescription.includes
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoDescription = params.videoDescription;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const videoDescriptionKeyConfig = {
      text: { isNullAllowed: false },
      includes: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.videoDescription, videoDescriptionKeyConfig);
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
      text: oThis.videoDescription.text,
      includes: oThis.videoDescription.includes
    });
  }
}

module.exports = VideoDescription;

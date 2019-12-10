const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class TagSingleFormatter extends BaseFormatter {
  /**
   * Constructor for TagSingleFormatter.
   *
   * @param {object} params
   * @param {object} params.tag
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.tag = params.tag;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const tagKeyConfig = {
      id: { isNullAllowed: false },
      name: { isNullAllowed: false },
      user_bio_weight: { isNullAllowed: false },
      status: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.tag, tagKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object|result}
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.tag.id,
      text: oThis.tag.name,
      weight: oThis.tag.user_bio_weight,
      video_weight: oThis.tag.videoWeight || 0,
      status: oThis.tag.status,
      uts: oThis.tag.updatedAt
    });
  }
}

module.exports = TagSingleFormatter;

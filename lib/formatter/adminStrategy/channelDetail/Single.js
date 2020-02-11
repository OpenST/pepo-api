const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for channel detail single formatter.
 *
 * @class ChannelDetailSingleFormatter
 */
class ChannelDetailSingleFormatter extends BaseFormatter {
  /**
   * Constructor for channel detail single formatter.
   *
   * @param {object} params
   * @param {object} params.channelDetail
   * @param {number} params.channelDetail.taglineId
   * @param {number} params.channelDetail.descriptionId
   * @param {number} params.channelDetail.coverImageId
   * @param {number} params.channelDetail.shareImageId
   * @param {string} params.channelDetail.permalink
   * @param {array<number>} params.channelDetail.tagIds
   * @param {number} params.channelDetail.updatedAt
   * @param {array<number>} params.tagIds
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelDetail = params.channelDetail;
    oThis.tagIds = params.tagIds;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const channelDetailKeyConfig = {
      taglineId: { isNullAllowed: true },
      descriptionId: { isNullAllowed: true },
      coverImageId: { isNullAllowed: true },
      shareImageId: { isNullAllowed: true },
      permalink: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.channelDetail, channelDetailKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object|result}
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      tagline_id: oThis.channelDetail.taglineId,
      description_id: oThis.channelDetail.descriptionId,
      cover_image_id: oThis.channelDetail.coverImageId,
      share_image_id: oThis.channelDetail.shareImageId,
      permalink: oThis.channelDetail.permalink,
      tag_ids: oThis.tagIds,
      uts: oThis.channelDetail.updatedAt
    });
  }
}

module.exports = ChannelDetailSingleFormatter;

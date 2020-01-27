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
   * @param {array<number>} params.channelDetail.tagIds
   * @param {number} params.channelDetail.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelDetail = params.channelDetail;
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
      tagIds: { isNullAllowed: false },
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
      taglineId: oThis.channelDetail.taglineId,
      descriptionId: oThis.channelDetail.descriptionId,
      coverImageId: oThis.channelDetail.coverImageId,
      tagIds: oThis.channelDetail.tagIds,
      uts: oThis.channel.updatedAt
    });
  }
}

module.exports = ChannelDetailSingleFormatter;

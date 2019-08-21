const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for get Video Details formatter.
 *
 * @class VideoDetailSingleFormatter
 */
class VideoDetailSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get Video Details formatter.
   *
   * @param {object} params
   * @param {object} params.videoDetail
   *
   * @param {number} params.videoDetail.id
   * @param {object} params.videoDetail.creatorUserId
   * @param {string} params.videoDetail.videoId
   * @param {number} params.videoDetail.totalContributedBy
   * @param {number} params.videoDetail.totalAmount
   * @param {number} params.videoDetail.totalTransactions
   * @param {number} params.videoDetail.createdAt
   * @param {number} params.videoDetail.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoDetail = params.videoDetail;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const videoDetailKeyConfig = {
      id: { isNullAllowed: false },
      creatorUserId: { isNullAllowed: true },
      videoId: { isNullAllowed: false },
      descriptionId: { isNullAllowed: true },
      linkIds: { isNullAllowed: true },
      totalContributedBy: { isNullAllowed: false },
      totalAmount: { isNullAllowed: false },
      totalTransactions: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.videoDetail, videoDetailKeyConfig);
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
      id: Number(oThis.videoDetail.id),
      creator_user_id: Number(oThis.videoDetail.creatorUserId),
      video_id: Number(oThis.videoDetail.videoId),
      description_id: Number(oThis.videoDetail.descriptionId),
      link_ids: JSON.parse(oThis.videoDetail.linkIds),
      total_contributed_by: oThis.videoDetail.totalContributedBy,
      total_amount_raised_in_wei: oThis.videoDetail.totalAmount,
      total_transactions: oThis.videoDetail.totalTransactions,
      uts: Number(oThis.videoDetail.updatedAt)
    });
  }
}

module.exports = VideoDetailSingleFormatter;

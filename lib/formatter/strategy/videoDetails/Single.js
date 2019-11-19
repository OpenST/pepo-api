const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for video details formatter.
 *
 * @class VideoDetailSingleFormatter
 */
class VideoDetailSingleFormatter extends BaseFormatter {
  /**
   * Constructor for video details formatter.
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
   * @param {string} params.videoDetail.perReplyAmountInWei
   * @param {number} params.videoDetail.totalReplies
   * @param {number} params.videoDetail.isReplyAllowed
   * @param {string} params.videoDetail.status
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
      perReplyAmountInWei: { isNullAllowed: false },
      totalReplies: { isNullAllowed: false },
      isReplyAllowed: { isNullAllowed: false },
      status: { isNullAllowed: false },
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
      description_id: Number(oThis.videoDetail.descriptionId) || null,
      link_ids: oThis.videoDetail.linkIds,
      total_contributed_by: oThis.videoDetail.totalContributedBy,
      total_amount_raised_in_wei: oThis.videoDetail.totalAmount,
      total_transactions: oThis.videoDetail.totalTransactions,
      is_reply_allowed: oThis.videoDetail.isReplyAllowed,
      per_reply_amount_in_wei: oThis.videoDetail.perReplyAmountInWei,
      total_video_replies: Number(oThis.videoDetail.totalReplies),
      total_replies: Number(oThis.videoDetail.totalReplies),
      status: oThis.videoDetail.status,
      uts: Number(oThis.videoDetail.updatedAt)
    });
  }
}

module.exports = VideoDetailSingleFormatter;

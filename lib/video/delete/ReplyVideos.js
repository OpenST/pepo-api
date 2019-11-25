const rootPrefix = '../../..',
  VideoDeleteBase = require(rootPrefix + '/lib/video/delete/Base'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

// Declare variables.
const batchSize = 100;

/**
 * Class to delete videos of user.
 *
 * @class UserVideos
 */
class ReplyVideos extends VideoDeleteBase {
  /**
   * Constructor to delete reply videos.
   *
   * @param {object} params
   * @param {array<number>} params.replyDetailsIds
   * @param {boolean} [params.isUserAction]: isUserAction
   * @param {number} params.userId: User Id
   * @param {number} params.currentAdminId: currentAdminId
   *
   * @augments VideoDeleteBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.replyDetailsIds = params.replyDetailsIds;

    oThis.nonDeletedReplyDetailIds = [];
    oThis.replyDetailIdToVideoIdMap = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndSetIds();

    const replyDetailsIdsLength = oThis.nonDeletedReplyDetailIds.length;

    if (replyDetailsIdsLength === 0) {
      return responseHelper.successWithData({});
    }

    // Perform operations in batches.
    for (let index = 0; index < replyDetailsIdsLength; index += batchSize) {
      const replyDetailsIdsBatch = oThis.nonDeletedReplyDetailIds.slice(index, index + batchSize);
      const videoIdsBatch = [];

      for (let ind = 0; ind < replyDetailsIdsBatch.length; ind++) {
        videoIdsBatch.push(oThis.replyDetailIdToVideoIdMap[replyDetailsIdsBatch[ind]].entityId);
      }

      await oThis._markReplyDetailsDeleted(replyDetailsIdsBatch);
      await oThis._performOperations(videoIdsBatch);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch and set video ids.
   *
   * @sets oThis.nonDeletedReplyDetailIds, oThis.replyDetailIdToVideoIdMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndSetIds() {
    const oThis = this;

    const replyDetailsQueryObj = new ReplyDetailsModel().select('*');

    if (oThis.replyDetailsIds && oThis.replyDetailsIds.length > 0) {
      replyDetailsQueryObj.where({ id: oThis.replyDetailsIds });
    } else {
      replyDetailsQueryObj.where({ creator_user_id: oThis.userId });
    }

    const dbRows = await replyDetailsQueryObj.fire();

    for (let index = 0; index < dbRows.length; index++) {
      const replyDetail = dbRows[index];
      if (replyDetail.status !== replyDetailConstants.invertedStatuses[replyDetailConstants.deletedStatus]) {
        oThis.nonDeletedReplyDetailIds.push(replyDetail.id);
        oThis.replyDetailIdToVideoIdMap[replyDetail.id] = {
          entityId: replyDetail.entity_id,
          parentId: replyDetail.parent_id,
          entityKind: replyDetail.entity_kind
        };
      }
    }
  }

  /**
   * Decrement tag weight and remove video tag.
   *
   * @param {object} params
   * @param {array<number>} params.tagIds
   * @param {number} params.videoId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _decrementTagWeightAndRemoveVideoTag(params) {
    await new DecrementWeightsAndRemoveVideoTags({
      tagIds: params.tagIds,
      videoId: params.videoId,
      kind: videoTagConstants.replyKind
    }).perform();
  }

  /**
   * Mark deleted status in reply details.
   *
   * @param {array<number>} replyDetailsIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async _markReplyDetailsDeleted(replyDetailsIds) {
    const oThis = this;

    const totalReplyDeletedInParent = {},
      parentVideoIds = [];

    for (let index = 0; index < replyDetailsIds.length; index++) {
      const replyDetailsId = replyDetailsIds[index],
        parentId = oThis.replyDetailIdToVideoIdMap[replyDetailsId].parentId;

      const affectedRows = await new ReplyDetailsModel().markReplyDetailsDeleted({
        replyDetailsIds: [replyDetailsId]
      });
      if (affectedRows > 0) {
        parentVideoIds.push(parentId);
        totalReplyDeletedInParent[parentId] = totalReplyDeletedInParent[parentId] || 0;
        totalReplyDeletedInParent[parentId] += 1;
      }
    }

    for (const parentVId in totalReplyDeletedInParent) {
      await new VideoDetailModel()
        .update(['total_replies=total_replies-?', totalReplyDeletedInParent[parentVId]])
        .where({ video_id: parentVId })
        .fire();
    }

    return ReplyDetailsModel.flushCache({
      replyDetailIds: replyDetailsIds,
      parentVideoIds: parentVideoIds,
      userId: oThis.userId
    });
  }

  /**
   * Perform specific activities.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSpecificActivities() {
    // Do nothing.
  }
}

module.exports = ReplyVideos;

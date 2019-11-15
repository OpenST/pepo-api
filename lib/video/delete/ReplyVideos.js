const rootPrefix = '../../..',
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  VideoDeleteBase = require(rootPrefix + '/lib/video/delete/Base'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.replyDetailsIds = params.replyDetailsIds;
    oThis.replyDetailIdToVideoIdMap = {};
  }

  /**
   * Async Perform
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndSetIds();

    const replyDetailsIdsLength = oThis.replyDetailsIds.length;

    if (replyDetailsIdsLength === 0) {
      return responseHelper.successWithData({});
    }

    // Perform operations in batches.
    for (let index = 0; index < replyDetailsIdsLength; index += batchSize) {
      const replyDetailsIdsBatch = oThis.replyDetailsIds.slice(index, index + batchSize);
      let videoIdsBatch = [];

      for (let i = 0; i < replyDetailsIdsBatch.length; i++) {
        videoIdsBatch.push(oThis.replyDetailIdToVideoIdMap[replyDetailsIdsBatch[i]].entityId);
      }

      await oThis._markReplyDetailsDeleted(replyDetailsIdsBatch);
      await oThis._performOperations(videoIdsBatch);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch and set video ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndSetIds() {
    const oThis = this;

    const replyDetailsQueryObj = new ReplyDetailsModel().select('*');

    if (oThis.replyDetailsIds.length > 0) {
      replyDetailsQueryObj.where({ id: oThis.replyDetailsIds });
    } else {
      replyDetailsQueryObj.where({ creator_user_id: oThis.userId });
    }

    const dbRows = await replyDetailsQueryObj.fire();

    for (let index = 0; index < dbRows.length; index++) {
      let replyDetail = dbRows[index];
      if (replyDetail.status !== replyDetailConstants.invertedStatuses[replyDetailConstants.deletedStatus]) {
        oThis.replyDetailIdToVideoIdMap[replyDetail.id] = {
          entityId: replyDetail.entity_id,
          parentId: replyDetail.parent_id,
          entityKind: replyDetail.entity_kind
        };
      }
    }
  }

  /**
   * Decrement tag weight and remove video tag
   *
   * @param params
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
   * @param {array<number>} videoIds
   *
   * @return {Promise<*>}
   * @private
   */
  async _markReplyDetailsDeleted(replyDetailsIds) {
    const oThis = this;

    let totalReplyDeletedInParent = {},
      parentVideoIds = [];

    for (let i = 0; i < replyDetailsIds.length; i++) {
      let replyDetailsId = replyDetailsIds[i],
        parentId = oThis.replyDetailIdToVideoIdMap[replyDetailsId].parentId;

      let affectedRows = await new ReplyDetailsModel().markReplyDetailsDeleted({
        replyDetailsIds: [replyDetailsId]
      });
      if (affectedRows > 0) {
        parentVideoIds.push(parentId);
        totalReplyDeletedInParent[parentId] = totalReplyDeletedInParent[parentId] || 0;
        totalReplyDeletedInParent[parentId] = totalReplyDeletedInParent[parentId] + 1;
      }
    }

    for (let parentVId in totalReplyDeletedInParent) {
      await new VideoDetailModel()
        .update(['total_replies=total_replies-?', totalReplyDeletedInParent[parentVId]])
        .where({ id: parentVId })
        .fire();
    }

    return ReplyDetailsModel.flushCache({ replyDetailsIds: replyDetailsIds, parentVideoIds: parentVideoIds });
  }

  /**
   * Perform specific activities
   *
   * @param videoIds
   * @returns {Promise<void>}
   * @private
   */
  async _performSpecificActivities(videoIds) {
    //Do Nothing.
  }
}

module.exports = ReplyVideos;

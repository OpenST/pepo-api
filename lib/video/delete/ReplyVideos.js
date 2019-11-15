const rootPrefix = '../../..',
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
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
      let videoIdsBatch = [],
        parentVideoIds = [];

      for (let i = 0; i < replyDetailsIdsBatch.length; i++) {
        videoIdsBatch.push(oThis.replyDetailIdToVideoIdMap[replyDetailsIdsBatch[i].entityId]);
        parentVideoIds.push(oThis.replyDetailIdToVideoIdMap[replyDetailsIdsBatch[i].parentId]);
      }

      await oThis._markReplyDetailsDeleted(replyDetailsIdsBatch, parentVideoIds);
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
        oThis.replyDetailsIds.push(replyDetail.id);
        oThis.replyDetailIdToVideoIdMap[replyDetail.id] = {
          entityId: replyDetail.entity_id,
          parentId: replyDetail.parent_id,
          entityType: replyDetail.entity_type
        };
      }
    }
  }

  // TODO Ankit: decrese total_replies in video_details table for parent video.

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
  async _markReplyDetailsDeleted(replyDetailsIds, parentVideoIds) {
    return new ReplyDetailsModel().markReplyDetailsDeleted({
      replyDetailsIds: replyDetailsIds,
      parentVideoIds: parentVideoIds
    });
  }

  /**
   * Perform specific activities
   *
   * @param videoIds
   * @returns {Promise<void>}
   * @private
   */
  async _performSpecificActivities(videoIds) {
    //TODO: Ankit decrese total_replies in parent video.
  }
}

module.exports = ReplyVideos;

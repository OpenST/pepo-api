const rootPrefix = '../../..',
  VideoDeleteBase = require(rootPrefix + '/lib/video/delete/Base'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  VideoDistinctReplyCreatorsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDistinctReplyCreators'),
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

    oThis.creatorUserIdsMap = {};
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
          entityKind: replyDetail.entity_kind,
          status: replyDetailConstants.statuses[replyDetail.status]
        };
        oThis.creatorUserIdsMap[replyDetail.creator_user_id] =
          oThis.creatorUserIdsMap[replyDetail.creator_user_id] || {};
        oThis.creatorUserIdsMap[replyDetail.creator_user_id][replyDetail.parent_id] = 1;
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

    const parentIdToReplyDetailsIdsMap = {},
      parentVideoIds = [],
      promisesArray = [];

    const entityIds = [];

    for (let index = 0; index < replyDetailsIds.length; index++) {
      const replyDetailId = replyDetailsIds[index],
        entityId = oThis.replyDetailIdToVideoIdMap[replyDetailId].entityId,
        parentId = oThis.replyDetailIdToVideoIdMap[replyDetailId].parentId;

      entityIds.push(entityId);

      parentIdToReplyDetailsIdsMap[parentId] = parentIdToReplyDetailsIdsMap[parentId] || { active: [], notActive: [] };

      if (oThis.replyDetailIdToVideoIdMap[replyDetailId].status !== replyDetailConstants.activeStatus) {
        parentIdToReplyDetailsIdsMap[parentId].notActive.push(replyDetailId);
      } else {
        parentIdToReplyDetailsIdsMap[parentId].active.push(replyDetailId);
      }
    }

    for (const parentId in parentIdToReplyDetailsIdsMap) {
      const notActiveReplyDetailIds = parentIdToReplyDetailsIdsMap[parentId].notActive,
        activeReplyDetailIds = parentIdToReplyDetailsIdsMap[parentId].active;

      if (notActiveReplyDetailIds.length > 0) {
        await new ReplyDetailsModel().markReplyDetailsDeleted({
          replyDetailsIds: notActiveReplyDetailIds
        });
      }

      if (activeReplyDetailIds.length > 0) {
        const affectedRows = await new ReplyDetailsModel().markReplyDetailsDeleted({
          replyDetailsIds: activeReplyDetailIds
        });

        if (affectedRows > 0) {
          parentVideoIds.push(parentId);

          promisesArray.push(
            new VideoDetailModel()
              .update(['total_replies = total_replies - ?', affectedRows])
              .where({ video_id: parentId })
              .fire()
          );
        }
      }
    }

    await Promise.all(promisesArray);

    const promisesArr = [];
    promisesArr.push(VideoDetailModel.flushCache({ userId: oThis.userId, videoIds: parentVideoIds }));
    promisesArr.push(new VideoDistinctReplyCreatorsCache({ videoIds: parentVideoIds }).clear());

    const creatorUserIds = [];

    for (let creatorUserId in oThis.creatorUserIdsMap) {
      let parentIds = Object.keys(oThis.creatorUserIdsMap[creatorUserId]);
      creatorUserIds.push(creatorUserId);
      const cachePromise = ReplyDetailsModel.flushCache({
        parentIds: parentIds,
        creatorUserId: creatorUserId
      });

      promisesArr.push(cachePromise);
    }

    await Promise.all(promisesArr);

    return ReplyDetailsModel.flushCache({
      replyDetailIds: replyDetailsIds,
      userIds: creatorUserIds,
      parentVideoIds: parentVideoIds,
      entityKind: replyDetailConstants.videoEntityKind,
      entityIds: entityIds
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

const rootPrefix = '../../..',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FilterAtMentions = require(rootPrefix + '/lib/FilterOutAtMentions'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class to increase weights and add video tags for whitelisted creator for all videos.
 *
 * @class PostUserApprovalJob
 */
class PostUserApprovalJob {
  /**
   * Constructor to increase weights and add video tags for whitelisted creator for all videos.
   *
   * @param {object} params
   * @param {number} params.videoIds: Video id
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.currentAdminId = params.currentAdminId;
    oThis.userVideoIdsMap = {};
  }

  /**
   * Perform.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let videoDetailsResp = await new VideoDetailsModel().fetchVideoIds([oThis.userId]);

    oThis.userVideoIdsMap = videoDetailsResp[oThis.userId];

    await oThis._markInviteLimitAsInfinite();

    let promiseArray = [],
      videoIds = oThis.userVideoIdsMap.videoIds;

    for (let vi = 0; vi < videoIds.length; vi++) {
      promiseArray.push(oThis._updateTagAndVideoTag(videoIds[vi]));
    }
    await Promise.all(promiseArray);

    await oThis._publishFanVideo();

    await oThis._logAdminActivity();
  }

  /**
   * Mark invite limit as infinite
   *
   * @returns {Promise<*>}
   * @private
   */
  async _markInviteLimitAsInfinite() {
    const oThis = this;

    const queryResponse = await new InviteCodeModel()
      .update({
        invite_limit: inviteCodeConstants.infiniteInviteLimit
      })
      .where({ user_id: oThis.userId })
      .fire();

    if (queryResponse.affectedRows === 1) {
      logger.info(`User with ${oThis.userId} has now infinite invites`);

      const inviteCodeByUserIdCacheResponse = await new InviteCodeByUserIdsCache({
        userIds: [oThis.userId]
      }).fetch();

      if (inviteCodeByUserIdCacheResponse.isSuccess()) {
        let inviteCodeObj = inviteCodeByUserIdCacheResponse.data[oThis.userId];
        await InviteCodeModel.flushCache(inviteCodeObj);
      }
    }
  }

  /**
   * Publish fan video if any of approved users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _publishFanVideo() {
    const oThis = this;

    const promises = [],
      latestVideoId = oThis.userVideoIdsMap.videoIds[0];

    if (latestVideoId) {
      promises.push(oThis._addFeed(latestVideoId));
      promises.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.videoAdd, {
          userId: oThis.userId,
          videoId: latestVideoId
        })
      );
    }

    await Promise.all(promises);
  }

  /**
   * Add feed entry for user video.
   *
   * @param {number} videoId
   *
   * @returns {Promise<any>}
   * @private
   */
  async _addFeed(videoId) {
    const oThis = this;

    return new FeedModel()
      .insert({
        primary_external_entity_id: videoId,
        kind: feedsConstants.invertedKinds[feedsConstants.fanUpdateKind],
        actor: oThis.userId,
        pagination_identifier: Math.round(new Date() / 1000)
      })
      .fire();
  }

  /**
   * Perform action for each video.
   *
   * @param videoId
   * @returns {Promise<void>}
   * @private
   */
  async _updateTagAndVideoTag(videoId) {
    const oThis = this;

    let descriptionId = oThis.userVideoIdsMap.videoDetails[videoId].descriptionId;

    if (!descriptionId) {
      return;
    }

    let text = await oThis._fetchText(descriptionId);

    const filterTagsResp = await new FilterTags(text, descriptionId).perform(),
      videoDescriptionTagsData = filterTagsResp.data,
      tagIds = videoDescriptionTagsData.tagIds;

    if (tagIds.length === 0) {
      return;
    }

    await new IncrementWeightsAndAddVideoTags({ tagIds: tagIds, videoId: videoId }).perform();

    await oThis._filterAtMentions(videoDescriptionTagsData, descriptionId);

    // TODO @dhananjay - publish notification and activity for at-mentioned users.
  }

  /**
   * Filter at mentions.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterAtMentions(videoDescription, textId) {
    const oThis = this;

    // Filter out at mentions from video description.
    const filterMentionsResp = await new FilterAtMentions(videoDescription, textId).perform(),
      videoDescriptionAtMentionsData = filterMentionsResp.data;

    oThis.userNamesWithPrefix = videoDescriptionAtMentionsData.userNamesWithPrefix;
    oThis.userNamesToUserIdMap = videoDescriptionAtMentionsData.userNamesToUserIdMap;
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    await new ActivityLogModel().insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.userId,
      action: adminActivityLogConstants.approvedAsCreator
    });
  }

  /**
   * Fetch text.
   *
   * @param textId
   * @returns {Promise<*>}
   * @private
   */
  async _fetchText(textId) {
    const oThis = this;

    let textDetails = await new TextModel().fetchById(textId);

    return textDetails.text;
  }
}

module.exports = PostUserApprovalJob;

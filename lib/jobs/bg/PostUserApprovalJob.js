const rootPrefix = '../../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  webhookPreProcessorJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/webhookPreProcessor'),
  webhookPreProcessorJobConstants = require(rootPrefix + '/lib/globalConstant/webhookPreProcessorJob');

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
   * @param {number} params.userId: User Id.
   * @param {number} params.currentAdminId: Admin Id.
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.currentAdminId = params.currentAdminId;

    oThis.userVideoIdsMap = {};
    oThis.mentionedUserIds = [];
  }

  /**
   * Main performer for class.
   *
   * @sets oThis.userVideoIdsMap
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const videoDetailsResp = await new VideoDetailModel().fetchVideoIds([oThis.userId]);

    oThis.userVideoIdsMap = videoDetailsResp[oThis.userId];

    await oThis._markInviteLimitAsInfinite();

    const videoIds = oThis.userVideoIdsMap.videoIds;

    for (let index = 0; index < videoIds.length; index++) {
      await oThis._updateTagAndVideoTag(videoIds[index]);
      await oThis._enqueueWebhookPreprocessor(videoIds[index]);
    }

    await oThis._publishFanVideo();

    await oThis._logAdminActivity();
  }

  /**
   * Mark invite limit as infinite.
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
      logger.info(`User with ${oThis.userId} has now infinite invites.`);

      const inviteCodeByUserIdCacheResponse = await new InviteCodeByUserIdsCache({
        userIds: [oThis.userId]
      }).fetch();

      if (inviteCodeByUserIdCacheResponse.isSuccess()) {
        const inviteCodeObj = inviteCodeByUserIdCacheResponse.data[oThis.userId];
        await InviteCodeModel.flushCache(inviteCodeObj);
      }
    }
  }

  /**
   * Enqueue for webhook preprocessor.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueWebhookPreprocessor(videoId) {
    await webhookPreProcessorJobEnqueue.enqueue(webhookPreProcessorJobConstants.videoUpdateTopic, {
      videoId: videoId
    });
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
      await oThis._filterAtMentions(latestVideoId);
      promises.push(oThis._addFeed(latestVideoId));

      promises.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.videoNotificationsKind, {
          userId: oThis.userId,
          videoId: latestVideoId,
          mentionedUserIds: oThis.mentionedUserIds
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

    const feedInsertResp = await new FeedModel()
      .insert({
        primary_external_entity_id: videoId,
        kind: feedsConstants.invertedKinds[feedsConstants.fanUpdateKind],
        actor: oThis.userId,
        pagination_identifier: Math.round(new Date() / 1000)
      })
      .fire();

    const feedId = feedInsertResp.insertId;

    await FeedModel.flushCache({ ids: [feedId] });
  }

  /**
   * Perform action for each video.
   *
   * @param {number} videoId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTagAndVideoTag(videoId) {
    const oThis = this;

    const descriptionId = oThis.userVideoIdsMap.videoDetails[videoId].descriptionId;

    if (!descriptionId) {
      return;
    }

    const text = await oThis._fetchText(descriptionId);

    const filterTagsResp = await new FilterTags(text, descriptionId).perform(),
      videoDescriptionTagsData = filterTagsResp.data,
      tagIds = videoDescriptionTagsData.tagIds;

    if (tagIds.length === 0) {
      return;
    }

    await new IncrementWeightsAndAddVideoTags({
      tagIds: tagIds,
      videoId: videoId,
      kind: videoTagConstants.postKind
    }).perform();
  }

  /**
   * Filter at mentions.
   *
   * @param {number} latestVideoId
   *
   * @sets oThis.mentionedUserIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterAtMentions(latestVideoId) {
    const oThis = this;

    const descriptionId = oThis.userVideoIdsMap.videoDetails[latestVideoId].descriptionId;

    if (!descriptionId) {
      return;
    }

    const cacheRsp = await new TextIncludesByIdsCache({ ids: [descriptionId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const textIncludes = cacheRsp.data;

    for (const textId in textIncludes) {
      const includesForAllKinds = textIncludes[textId];

      for (let ind = 0; ind < includesForAllKinds.length; ind++) {
        const includeRow = includesForAllKinds[ind],
          entity = includeRow.entityIdentifier.split('_');

        if (entity[0] === textIncludeConstants.userEntityKindShort) {
          oThis.mentionedUserIds.push(entity[1]);
        }
      }
    }
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
   * @param {number} textId
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchText(textId) {
    const textDetails = await new TextModel().fetchById(textId);

    return textDetails.text;
  }
}

module.exports = PostUserApprovalJob;

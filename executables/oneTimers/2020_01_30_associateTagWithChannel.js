const program = require('commander');

const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  ChannelTagModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTag'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  UserMuteByUser2IdsForGlobalCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser2IdsForGlobal'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  channelTagConstants = require(rootPrefix + '/lib/globalConstant/channel/channelTags'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

program
  .option('--channelId <channelId>', 'Channel Id')
  .option('--tagId <tagId>', 'Tag Id')
  .option('--backPopulateVideos <backPopulateVideos>', 'backpopulate old videos')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(
    'node executables/oneTimers/2020_01_30_associateTagWithChannel.js --channelId 1 --tagId 10736 --backPopulateVideos 1'
  );
  logger.log('');
  logger.log('');
});

if (!program.channelId || !program.tagId) {
  program.help();
  process.exit(1);
}

/**
 * Class to associate a new tag with channel.
 *
 * @class AssociateTagWithChannel
 */
class AssociateTagWithChannel {
  /**
   * Constructor to associate a new tag with channel.
   *
   * @param {object} params
   * @param {number} params.channelId
   * @param {number} params.tagId
   * @param {boolean} [params.backPopulateVideos]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.channelId = parseInt(params.channelId);
    oThis.tagId = parseInt(params.tagId);
    oThis.backPopulateVideos = parseInt(params.backPopulateVideos) || 0;

    oThis.channel = null;
    oThis.channelTag = null;
    oThis.channelVideoCount = 0;
    oThis.channelVideoMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.validateChannel();

    await oThis.validateChannelTag();

    await oThis.addUpdateChannelTag();

    if (oThis.backPopulateVideos) {
      await oThis.backPopulateChannelVideos();
    }
  }

  /**
   * Backpopulate videos for a channel.
   *
   * @sets oThis.channelTag
   *
   * @returns {Promise<void>}
   * @private
   */
  async backPopulateChannelVideos() {
    const oThis = this;

    logger.info('ChannelTag backPopulateChannelVideos started');

    const limit = 100;
    let paginationTimestamp = null;

    while (true) {
      oThis.channelVideoCount = 0;
      oThis.channelVideoMap = {};

      const videoIds = [];
      const videoTagMapByVideoId = {};

      const videoTagArr = await new VideoTagModel().fetchByTagId({
        tagId: oThis.tagId,
        limit: limit,
        paginationTimestamp: paginationTimestamp,
        kind: videoTagConstants.postKind
      });

      if (videoTagArr.length === 0) {
        logger.info('ChannelTag backPopulateChannelVideos ended');

        return;
      }

      for (let index = 0; index < videoTagArr.length; index++) {
        const videoTag = videoTagArr[index],
          videoId = videoTag.videoId;

        videoIds.push(videoId);
        paginationTimestamp = videoTag.createdAt;
        videoTagMapByVideoId[videoId] = videoTag;
      }

      const activeVideoIds = await oThis.filterOutVideos(videoIds);
      const resp = await oThis.fetchChannelVideoForVideoId(activeVideoIds);

      await oThis.insertInChannelVideo(resp.toInsertVideoIds, videoTagMapByVideoId);
      await oThis.markChannelVideoActive(resp.inactiveChannelVideoIds, videoTagMapByVideoId);
      await oThis._updateChannelStat();
      await oThis.insertInChannelTagVideo(activeVideoIds, videoTagMapByVideoId);
    }
  }

  /**
   * Multi insert in  channel tag video.
   *
   * @returns {Promise<void>}
   * @private
   */
  async insertInChannelTagVideo(videoIds, videoTagMapByVideoId) {
    const oThis = this;

    const insertColumns = ['channel_id', 'tag_id', 'video_id', 'pinned_at', 'created_at', 'updated_at'],
      insertValues = [];

    if (videoIds.length === 0) {
      return;
    }

    for (let index = 0; index < videoIds.length; index++) {
      // Note: use tag creation time for backpopulate.

      const videoId = videoIds[index],
        videoTag = videoTagMapByVideoId[videoId],
        channelVideo = oThis.channelVideoMap[videoId],
        pinnedAt =
          channelVideo &&
          channelVideo.id &&
          channelVideo.pinnedAt &&
          channelVideo.status === channelVideosConstants.activeStatus
            ? channelVideo.pinnedAt
            : null;

      insertValues.push([oThis.channelId, oThis.tagId, videoId, pinnedAt, videoTag.createdAt, videoTag.createdAt]);
    }

    await new ChannelTagVideoModel()
      .insertMultiple(insertColumns, insertValues, { touch: false, withIgnore: true })
      .fire();

    await ChannelTagVideoModel.flushCache({ channelId: oThis.channelId, tagId: oThis.tagId });
  }

  /**
   * Update channel stat.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelStat() {
    const oThis = this;

    if (oThis.channelVideoCount === 0) {
      return;
    }

    await new ChannelStatModel()
      .update(['total_videos = total_videos + ?', oThis.channelVideoCount])
      .where({ channel_id: oThis.channelId })
      .fire();

    await ChannelStatModel.flushCache({ channelIds: [oThis.channelId] });
  }

  /**
   * Mark channel video active.
   *
   * @returns {Promise<void>}
   * @private
   */
  async markChannelVideoActive(channelVideoIds) {
    const oThis = this;
    //  Update channel videos if inactive status.

    if (channelVideoIds.length === 0) {
      return;
    }

    const updateRes = await new ChannelVideoModel()
      .update(
        {
          status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus],
          pinned_at: null
        },
        { touch: false }
      )
      .where({ id: channelVideoIds })
      .where(['status != ?', channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]])
      .fire();

    oThis.channelVideoCount += updateRes.affectedRows;

    await ChannelVideoModel.flushCache({ channelId: oThis.channelId });
  }

  /**
   * Multi insert in  channel video.
   *
   * @returns {Promise<void>}
   * @private
   */
  async insertInChannelVideo(videoIds, videoTagMapByVideoId) {
    const oThis = this;

    const insertColumns = ['channel_id', 'video_id', 'status', 'created_at', 'updated_at'],
      insertValues = [],
      status = channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus];

    if (videoIds.length === 0) {
      return;
    }

    for (let index = 0; index < videoIds.length; index++) {
      const videoId = videoIds[index],
        videoTag = videoTagMapByVideoId[videoId],
        // Use tag creation time for backpopulate.
        insertValue = [oThis.channelId, videoId, status, videoTag.createdAt, videoTag.createdAt];

      insertValues.push(insertValue);
    }

    const res = await new ChannelVideoModel()
      .insertMultiple(insertColumns, insertValues, { touch: false, withIgnore: true })
      .fire();

    oThis.channelVideoCount += videoIds.length;

    if (res.Duplicates > 0) {
      const updateRes = await new ChannelVideoModel()
        .update(
          {
            status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus],
            pinned_at: null
          },
          { touch: false }
        )
        .where({
          channel_id: oThis.channelId,
          video_id: oThis.videoId
        })
        .where(['status != ?', channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]])
        .fire();

      oThis.channelVideoCount -= res.Duplicates - updateRes.affectedRows;
    }

    await ChannelVideoModel.flushCache({ channelId: oThis.channelId });
  }

  /**
   * Fetch channel video objects for video id in a channel.
   *
   * @returns {Promise<never>}
   * @private
   */
  async fetchChannelVideoForVideoId(videoIds) {
    const oThis = this;

    const toInsertVideoIds = [],
      inactiveChannelVideoIds = [];

    if (videoIds.length === 0) {
      return { inactiveChannelVideoIds: inactiveChannelVideoIds, toInsertVideoIds: toInsertVideoIds };
    }

    const response = await new ChannelVideoModel()
      .select('*')
      .where({
        channel_id: oThis.channelId,
        video_id: videoIds
      })
      .fire();

    for (let index = 0; index < response.length; index++) {
      const channelVideo = new ChannelVideoModel().formatDbData(response[index]);
      oThis.channelVideoMap[channelVideo.videoId] = channelVideo;
    }

    for (let index = 0; index < videoIds.length; index++) {
      const videoId = videoIds[index];
      const channelVideo = oThis.channelVideoMap[videoId];

      if (!CommonValidator.validateNonEmptyObject(channelVideo)) {
        toInsertVideoIds.push(videoId);
      } else if (channelVideo.status !== channelVideosConstants.activeStatus) {
        inactiveChannelVideoIds.push(channelVideo.id);
      } else {
        // Do nothing.
      }
    }

    return { inactiveChannelVideoIds: inactiveChannelVideoIds, toInsertVideoIds: toInsertVideoIds };
  }

  /**
   * Filter out inactive videos and unapproved/blockedInChannel users video.
   *
   * @returns {Promise<never>}
   * @private
   */
  async filterOutVideos(videoIds) {
    const oThis = this;

    const activeVideoIds = [],
      actorIds = [];

    // Note: Filter out inactive and unapproved and muted users

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: videoIds }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }
    const videoDetailsCacheData = videoDetailsCacheResponse.data;

    for (const videoId in videoDetailsCacheData) {
      const videoDetail = videoDetailsCacheData[videoId];

      if (CommonValidator.validateNonEmptyObject(videoDetail)) {
        actorIds.push(videoDetail.creatorUserId);
      }
    }

    const mutedUserIdMap = {};
    const cacheResponse = await new UserMuteByUser2IdsForGlobalCache({ user2Ids: actorIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const globalUserMuteDetailsByUserIdMap = cacheResponse.data;

    for (const userId in globalUserMuteDetailsByUserIdMap) {
      const obj = globalUserMuteDetailsByUserIdMap[userId];
      if (obj.all) {
        mutedUserIdMap[userId] = 1;
      }
    }

    const blockedUserIdMap = {};
    const blockedUserIds = await new ChannelUserModel()
      .select('user_id')
      .where({
        user_id: actorIds,
        channel_id: oThis.channelId,
        status: channelUsersConstants.invertedStatuses[channelUsersConstants.blockedStatus]
      })
      .fire();

    for (let index = 0; index < blockedUserIds.length; index++) {
      const blockedUserId = blockedUserIds[index].user_id;
      blockedUserIdMap[blockedUserId] = 1;
    }

    for (const videoId in videoDetailsCacheData) {
      const videoDetail = videoDetailsCacheData[videoId];

      if (
        CommonValidator.validateNonEmptyObject(videoDetail) &&
        videoDetail.status === videoDetailsConstants.activeStatus &&
        !mutedUserIdMap[videoDetail.creatorUserId]
      ) {
        if (blockedUserIdMap[videoDetail.creatorUserId] != 1) {
          activeVideoIds.push(videoId);
        }
      } else {
        logger.error(`Invalid Video id found in VideoTag. videoId:${videoId}  tagId:${oThis.tagId}`);
      }
    }

    return activeVideoIds;
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channel
   *
   * @returns {Promise<never>}
   * @private
   */
  async validateChannel() {
    const oThis = this;

    logger.info('Channel validation started.');

    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channel = cacheResponse.data[oThis.channelId];

    if (
      !CommonValidator.validateNonEmptyObject(oThis.channel) ||
      oThis.channel.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_o_atc_vc_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId
          }
        })
      );
    }

    logger.info('Channel validation done.');
  }

  /**
   * Fetch and validate channel tag.
   *
   * @sets oThis.channelId
   *
   * @returns {Promise<void>}
   */
  async validateChannelTag() {
    const oThis = this;

    const response = await new ChannelTagModel()
      .select('*')
      .where({
        channel_id: oThis.channelId,
        tag_id: oThis.tagId
      })
      .fire();

    if (response.length > 0) {
      oThis.channelTag = new ChannelTagModel().formatDbData(response[0]);
    }

    if (
      CommonValidator.validateNonEmptyObject(oThis.channelTag) &&
      oThis.channelTag.status === channelTagConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_o_atc_vt_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            tagId: oThis.tagId
          }
        })
      );
    }

    logger.info('Channel Tag validation done.');
  }

  /**
   * Add/Update channel tag.
   *
   * @sets oThis.channelTag
   *
   * @returns {Promise<never>}
   * @private
   */
  async addUpdateChannelTag() {
    const oThis = this;

    logger.info('ChannelTag addUpdateChannelTag started.');

    if (oThis.channelTag && oThis.channelTag.id) {
      await new ChannelTagModel()
        .update({ status: channelTagConstants.invertedStatuses[channelTagConstants.activeStatus] })
        .where({
          id: oThis.channelTag.id
        })
        .fire();

      oThis.channelTag.status = channelTagConstants.activeStatus;
    } else {
      const insertData = {
        channel_id: oThis.channelId,
        tag_id: oThis.tagId,
        status: channelTagConstants.invertedStatuses[channelTagConstants.activeStatus]
      };

      const insertResponse = await new ChannelTagModel().insert(insertData).fire();

      insertData.id = insertResponse.insertId;

      Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

      oThis.channelTag = new ChannelTagModel().formatDbData(insertData);
    }

    await ChannelTagModel.flushCache({ channelIds: [oThis.channelTag.channelId] });

    logger.info('ChannelTag addUpdateChannelTag done.');
  }
}

new AssociateTagWithChannel({
  channelId: program.channelId,
  tagId: program.tagId,
  backPopulateVideos: program.backPopulateVideos
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });

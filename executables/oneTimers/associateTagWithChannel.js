const program = require('commander');

const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  ChannelTagModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTag'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  UserMuteByUser2IdsForGlobalCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser2IdsForGlobal'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  channelTagConstants = require(rootPrefix + '/lib/globalConstant/channel/channelTags'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

program
  .option('--channelId <channelId>', 'Channel Id')
  .option('--tagId <tagId>', 'Tag Id')
  .option('--backPopulateVideos <backPopulateVideos>', 'backpopulate old videos')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('node executables/oneTimers/associateTagWithChannel --channelId 1 --tagId 10001 --backPopulateVideos 0');
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
   * @param {Boolean} [params.backPopulateVideos]
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
  }

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
   * @returns {Promise<never>}
   * @private
   */
  async backPopulateChannelVideos() {
    const oThis = this;

    logger.info(`ChannelTag backPopulateChannelVideos started`);

    const limit = 100;
    let paginationTimestamp = null;

    while (true) {
      oThis.channelVideoCount = 0;
      const videoIds = [];
      const videoTagMapByVideoId = {};

      const videoTagArr = await new VideoTagModel().fetchByTagId({
        tagId: oThis.tagId,
        limit: limit,
        paginationTimestamp: paginationTimestamp,
        kind: videoTagConstants.postKind
      });

      if (videoTagArr.length === 0) {
        logger.log(`backPopulateChannelVideos complete`);
        return;
      }

      for (let i = 0; i < videoTagArr.length; i++) {
        const videoTag = videoTagArr[i],
          videoId = videoTag.videoId;

        videoIds.push(videoId);
        paginationTimestamp = videoTag.createdAt;
        videoTagMapByVideoId[videoId] = videoTag;
      }

      const activeVideoIds = await oThis.filterOutDeletedVideos(videoIds);
      const resp = await oThis.fetchChannelVideoForVideoId(activeVideoIds);

      //todo: insert in channelTagVideos with ignore error..
      await oThis.insertInChannelVideo(resp.toInsertVideoIds, videoTagMapByVideoId);
      await oThis.markChannelVideoActive(resp.inactiveChannelVideoIds, videoTagMapByVideoId);
      await oThis._updateChannelStat();
    }

    logger.info(`ChannelTag backPopulateChannelVideos ended`);
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

    await ChannelStatModel.flushCache({ channelId: oThis.channelId });
  }

  /**
   * Mark Channel Video Active.
   *
   * @returns {Promise<never>}
   * @private
   */
  async markChannelVideoActive(channelVideoIds) {
    const oThis = this;
    //  update channel videos if inactive status

    if (channelVideoIds.length === 0) {
      return;
    }

    const updateRes = await new ChannelVideoModel()
      .update(
        {
          status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
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
   * Multi insert in  Channel Video.
   *
   * @returns {Promise<never>}
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

    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i],
        videoTag = videoTagMapByVideoId[videoId],
        //use tag creation time for backpopulate
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
            status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
          },
          { touch: false }
        )
        .where({
          channel_id: oThis.channelId,
          video_id: oThis.videoId
        })
        .where(['status != ?', channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]])
        .fire();

      oThis.channelVideoCount = oThis.channelVideoCount - (res.Duplicates + updateRes.affectedRows);
    }

    await ChannelVideoModel.flushCache({ channelId: oThis.channelId });
  }

  /**
   * Fetch Channel Video objects For VideoId in a channel.
   *
   * @returns {Promise<never>}
   * @private
   */
  async fetchChannelVideoForVideoId(videoIds) {
    const oThis = this;

    const toInsertVideoIds = [],
      inactiveChannelVideoIds = [],
      channelVideoMap = {};

    const response = await new ChannelVideoModel()
      .select('*')
      .where({
        channel_id: oThis.channelId,
        video_id: videoIds
      })
      .fire();

    for (let i = 0; i < response.length; i++) {
      const channelVideo = new ChannelVideoModel().formatDbData(response[i]);
      channelVideoMap[channelVideo.videoId] = channelVideo;
    }

    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      const channelVideo = channelVideoMap[videoId];

      if (!CommonValidator.validateNonEmptyObject(channelVideo)) {
        toInsertVideoIds.push(videoId);
      } else if (channelVideo.status !== channelVideosConstants.activeStatus) {
        inactiveChannelVideoIds.push(channelVideo.id);
      } else {
        //    Do Nothing....
      }
    }

    return { inactiveChannelVideoIds: inactiveChannelVideoIds, toInsertVideoIds: toInsertVideoIds };
  }

  /**
   * Filter out inactive and unapproved videos.
   *
   * @returns {Promise<never>}
   * @private
   */
  async filterOutDeletedVideos(videoIds) {
    const oThis = this;

    const activeVideoIds = [],
      actorIds = [];

    //Note: Filter out inactive and unapproved and muted users

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: videoIds }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }
    const videoDetailsCacheData = videoDetailsCacheResponse.data;

    for (let videoId in videoDetailsCacheData) {
      const videoDetail = videoDetailsCacheData[videoId];

      if (CommonValidator.validateNonEmptyObject(videoDetail)) {
        actorIds.push(videoDetail.creatorUserId);
      }
    }

    const mutedUserIds = {};
    const cacheResponse = await new UserMuteByUser2IdsForGlobalCache({ user2Ids: actorIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const globalUserMuteDetailsByUserIdMap = cacheResponse.data;

    for (const userId in globalUserMuteDetailsByUserIdMap) {
      const obj = globalUserMuteDetailsByUserIdMap[userId];
      if (obj.all) {
        mutedUserIds[userId] = 1;
      }
    }

    for (let videoId in videoDetailsCacheData) {
      const videoDetail = videoDetailsCacheData[videoId];

      if (
        CommonValidator.validateNonEmptyObject(videoDetail) &&
        videoDetail.status === videoDetailsConstants.activeStatus &&
        !mutedUserIds[videoDetail.creatorUserId]
      ) {
        activeVideoIds.push(videoId);
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
   * Fetch and Validate channel Tag.
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

    logger.info(`Channel Tag validation done`);
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

    logger.info(`ChannelTag addUpdateChannelTag started`);

    if (oThis.channelTag && oThis.channelTag.id) {
      await new ChannelTagModel()
        .update({ status: channelTagConstants.invertedStatuses[channelTagConstants.activeStatus] })
        .where({
          id: oThis.channelTag.id
        })
        .fire();

      oThis.channelTag.status = channelTagConstants.activeStatus;
    } else {
      let insertData = {
        channel_id: oThis.channelId,
        tag_id: oThis.tagId,
        status: channelTagConstants.invertedStatuses[channelTagConstants.activeStatus]
      };

      const insertResponse = await new ChannelTagModel().insert(insertData).fire();

      insertData.id = insertResponse.insertId;

      Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

      oThis.channelTag = new ChannelTagModel().formatDbData(insertData);
    }

    await ChannelTagModel.flushCache(oThis.channelTag);

    logger.info(`ChannelTag addUpdateChannelTag done`);
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

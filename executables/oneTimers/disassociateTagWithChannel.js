const program = require('commander');

const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  ChannelTagModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTag'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  channelTagConstants = require(rootPrefix + '/lib/globalConstant/channel/channelTags'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

program
  .option('--channelId <channelId>', 'Channel Id')
  .option('--tagId <tagId>', 'Tag Id')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('node executables/oneTimers/disassociateTagWithChannel --channelId 1 --tagId 10001');
  logger.log('');
  logger.log('');
});

if (!program.channelId || !program.tagId) {
  program.help();
  process.exit(1);
}

/**
 * Class to remove a tag from channel.
 *
 * @class DisassociateTagWithChannel
 */
class DisassociateTagWithChannel {
  /**
   * Constructor to remove a tag from channel.
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

    oThis.channel = null;
    oThis.channelTag = null;
    oThis.channelVideoCount = 0;
    oThis.channelVideoMap = {};
  }

  async perform() {
    const oThis = this;

    await oThis.validateChannel();

    await oThis.validateChannelTag();

    await oThis.markChannelTagInactive();

    await oThis.removeChannelVideos();
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
          internal_error_identifier: 'e_o_dtc_vc_1',
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
   * @sets oThis.channelTag
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
      !CommonValidator.validateNonEmptyObject(oThis.channelTag) ||
      oThis.channelTag.status !== channelTagConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_o_dtc_vt_1',
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
   * Mark channel tag Inactive.
   *
   * @sets oThis.channelTag
   *
   * @returns {Promise<never>}
   * @private
   */
  async markChannelTagInactive() {
    const oThis = this;

    logger.info(`ChannelTag markChannelTagInactive started`);

    await new ChannelTagModel()
      .update({ status: channelTagConstants.invertedStatuses[channelTagConstants.inactiveStatus] })
      .where({
        id: oThis.channelTag.id
      })
      .fire();

    oThis.channelTag.status = channelTagConstants.inactiveStatus;

    await ChannelTagModel.flushCache(oThis.channelTag);

    logger.info(`ChannelTag markChannelTagInactive done`);
  }

  /**
   * remove videos for a channel with tag id.
   *
   * @returns {Promise<never>}
   * @private
   */
  async removeChannelVideos() {
    const oThis = this;

    logger.info(`ChannelTag removeChannelVideos started`);

    const limit = 100;
    let lastVideoId = null;

    while (true) {
      const videoIds = [],
        channelTagVideoIds = [],
        videoIdMap = {};

      let dbQuery = new ChannelTagVideoModel()
        .select('*')
        .where({
          channel_id: oThis.channelId,
          tag_id: oThis.tagId
        })
        .limit(limit)
        .order_by('video_id desc');

      if (lastVideoId) {
        dbQuery = dbQuery.where(['video_id < ?', lastVideoId]);
      }

      const res = await dbQuery.fire();

      if (res.length === 0) {
        logger.log(`removeChannelVideos complete`);
        return;
      }

      for (let i = 0; i < res.length; i++) {
        const videoId = res[i].video_id;
        videoIds.push(videoId);
        channelTagVideoIds.push(res[i].id);
        videoIdMap[videoId] = 1;
      }

      await oThis.deleteChannelTagVideoForIds(channelTagVideoIds);
      await oThis.deleteFromChannelVideos(videoIds, videoIdMap);
    }

    logger.info(`ChannelTag removeChannelVideos ended`);
  }

  /**
   * delete from channelTagVideos model.
   *
   * @returns {Promise<never>}
   * @private
   */
  async deleteChannelTagVideoForIds(channelTagVideoIds) {
    const oThis = this;

    await new ChannelTagVideoModel()
      .delete()
      .where({ id: channelTagVideoIds })
      .fire();

    await ChannelTagVideoModel.flushCache({ channelId: oThis.channelId, tagId: oThis.tagId });
  }

  /**
   * delete videos without other tags in the channel.
   *
   * @returns {Promise<never>}
   * @private
   */
  async deleteFromChannelVideos(videoIds, videoIdMap) {
    const oThis = this;

    let dbQuery = await new ChannelTagVideoModel()
      .select('video_id')
      .where({
        channel_id: oThis.channelId,
        video_id: videoIds
      })
      .where(['tag_id != ?', oThis.tagId])
      .fire();

    for (let i = 0; i < dbQuery.length; i++) {
      const videoId = dbQuery[i].video_id;
      videoIdMap[videoId] = 0;
    }

    const videoIdsToBeDeletedInChannelVideo = [];

    for (let videoId in videoIdMap) {
      if (videoIdMap[videoId]) {
        videoIdsToBeDeletedInChannelVideo.push(videoId);
      }
    }

    await oThis.markChannelVideoInactive(videoIdsToBeDeletedInChannelVideo);
    await oThis._updateChannelStat(videoIdsToBeDeletedInChannelVideo.length);
  }

  /**
   * Mark Channel Video Inactive.
   *
   * @returns {Promise<never>}
   * @private
   */
  async markChannelVideoInactive(videoIdsToBeDeletedInChannelVideo) {
    const oThis = this;
    //  update channel videos if inactive status

    if (videoIdsToBeDeletedInChannelVideo.length === 0) {
      return;
    }

    const updateRes = await new ChannelVideoModel()
      .update(
        {
          status: channelVideosConstants.invertedStatuses[channelVideosConstants.inactiveStatus],
          pinned_at: null
        },
        { touch: false }
      )
      .where({
        video_id: videoIdsToBeDeletedInChannelVideo,
        channel_id: oThis.channelId
      })
      .fire();

    await ChannelVideoModel.flushCache({ channelId: oThis.channelId });
  }

  /**
   * Update channel stat.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateChannelStat(channelVideoCount) {
    const oThis = this;

    if (channelVideoCount === 0) {
      return;
    }

    await new ChannelStatModel()
      .update(['total_videos = total_videos - ?', channelVideoCount])
      .where({ channel_id: oThis.channelId })
      .fire();

    await ChannelStatModel.flushCache({ channelId: oThis.channelId });
  }
}

new DisassociateTagWithChannel({
  channelId: program.channelId,
  tagId: program.tagId
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });

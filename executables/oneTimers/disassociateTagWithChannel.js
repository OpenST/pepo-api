const program = require('commander');

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelTagModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTag'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelTagConstants = require(rootPrefix + '/lib/globalConstant/channel/channelTags'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

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

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
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
      !CommonValidators.validateNonEmptyObject(oThis.channel) ||
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
   * Fetch and validate channel tag.
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
      !CommonValidators.validateNonEmptyObject(oThis.channelTag) ||
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

    logger.info('Channel Tag validation done.');
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

    logger.info('ChannelTag markChannelTagInactive started.');

    await new ChannelTagModel()
      .update({ status: channelTagConstants.invertedStatuses[channelTagConstants.inactiveStatus] })
      .where({
        id: oThis.channelTag.id
      })
      .fire();

    oThis.channelTag.status = channelTagConstants.inactiveStatus;

    await ChannelTagModel.flushCache({ channelIds: [oThis.channelTag.channelId] });

    logger.info('ChannelTag markChannelTagInactive done.');
  }

  /**
   * Remove videos for a channel with tag id.
   *
   * @returns {Promise<void>}
   * @private
   */
  async removeChannelVideos() {
    const oThis = this;

    logger.info('ChannelTag removeChannelVideos started');

    const limit = 100;
    const lastVideoId = null;

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
        logger.info('ChannelTag removeChannelVideos ended');

        return;
      }

      for (let index = 0; index < res.length; index++) {
        const videoId = res[index].video_id;
        videoIds.push(videoId);
        channelTagVideoIds.push(res[index].id);
        videoIdMap[videoId] = 1;
      }

      await oThis.deleteChannelTagVideoForIds(channelTagVideoIds);
      await oThis.deleteFromChannelVideos(videoIds, videoIdMap);
    }
  }

  /**
   * Delete from channelTagVideos model.
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
   * Delete videos without other tags in the channel.
   *
   * @returns {Promise<never>}
   * @private
   */
  async deleteFromChannelVideos(videoIds, videoIdMap) {
    const oThis = this;

    const dbQuery = await new ChannelTagVideoModel()
      .select('video_id')
      .where({
        channel_id: oThis.channelId,
        video_id: videoIds
      })
      .where(['tag_id != ?', oThis.tagId])
      .fire();

    for (let index = 0; index < dbQuery.length; index++) {
      const videoId = dbQuery[index].video_id;
      videoIdMap[videoId] = 0;
    }

    const videoIdsToBeDeletedInChannelVideo = [];

    for (const videoId in videoIdMap) {
      if (videoIdMap[videoId]) {
        videoIdsToBeDeletedInChannelVideo.push(videoId);
      }
    }

    await oThis.markChannelVideoInactive(videoIdsToBeDeletedInChannelVideo);
    await oThis._updateChannelStat(videoIdsToBeDeletedInChannelVideo.length);
  }

  /**
   * Mark channel video inactive.
   *
   * @returns {Promise<void>}
   * @private
   */
  async markChannelVideoInactive(videoIdsToBeDeletedInChannelVideo) {
    const oThis = this;
    //  update channel videos if inactive status

    if (videoIdsToBeDeletedInChannelVideo.length === 0) {
      return;
    }

    await new ChannelVideoModel()
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

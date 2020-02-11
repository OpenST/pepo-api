const program = require('commander');

const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

program
  .option('--channelId <channelId>', 'Channel Id')
  .option('--videoId <videoId>', 'Video Id')
  .option('--unpin <videoId>', 'Unpin Video')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('node executables/oneTimers/2020_01_30_pinVideoInChannel.js --channelId 1 --videoId 1018 --unpin 0');
  logger.log('');
  logger.log('');
});

if (!program.channelId || !program.videoId) {
  program.help();
  process.exit(1);
}

/**
 * Class to pin a video for a channel.
 *
 * @class PinVideoInChannel
 */
class PinVideoInChannel {
  /**
   * Constructor to pin a video for a channel.
   *
   * @param {object} params
   * @param {number/string} params.channelId
   * @param {number/string} params.videoId
   * @param {boolean} params.unpin
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.channelId = parseInt(params.channelId);
    oThis.videoId = parseInt(params.videoId);
    oThis.unpin = parseInt(params.unpin) || 0;

    oThis.pinnedAtVal = oThis.unpin ? null : Math.floor(Date.now() / 1000);

    oThis.channel = null;
    oThis.channelTagIds = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.validateChannel();

    await oThis.validateChannelVideo();

    await oThis.pinChannelVideo();

    await oThis.fetchChannelTagIds();

    await oThis.pinChannelTagVideo();
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
          internal_error_identifier: 'e_o_pvic_vc_1',
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
   * @sets oThis.channelVideo
   *
   * @returns {Promise<void>}
   */
  async validateChannelVideo() {
    const oThis = this;

    const response = await new ChannelVideoModel()
      .select('*')
      .where({
        channel_id: oThis.channelId,
        video_id: oThis.videoId
      })
      .fire();

    if (response.length > 0) {
      oThis.channelVideo = new ChannelVideoModel().formatDbData(response[0] || {});
    }

    if (
      !CommonValidator.validateNonEmptyObject(oThis.channelVideo) ||
      !oThis.channelVideo.status === channelVideosConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_o_pvic_vcv_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            videoId: oThis.videoId
          }
        })
      );
    }

    logger.info('Channel video validation done.');
  }

  /**
   * Pin channel video.
   *
   * @returns {Promise<never>}
   * @private
   */
  async pinChannelVideo() {
    const oThis = this;
    //  Update channel videos.

    await new ChannelVideoModel()
      .update({ pinned_at: oThis.pinnedAtVal })
      .where({ id: oThis.channelVideo.id })
      .fire();

    await ChannelVideoModel.flushCache({ channelId: oThis.channelId });
  }

  /**
   * Fetch channel tag ids.
   *
   * @sets oThis.channelTagIds
   *
   * @returns {Promise<void>}
   */
  async fetchChannelTagIds() {
    const oThis = this;

    const cacheResponse = await new ChannelTagByChannelIdsCache({ channelIds: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelTagIds = cacheResponse.data[oThis.channelId];
  }

  /**
   * Pin channel tag video.
   *
   * @returns {Promise<never>}
   * @private
   */
  async pinChannelTagVideo() {
    const oThis = this;
    // Update channel tag videos.

    await new ChannelTagVideoModel()
      .update({ pinned_at: oThis.pinnedAtVal })
      .where({
        channel_id: oThis.channelId,
        video_id: oThis.videoId
      })
      .fire();

    const promisesArray = [];
    for (let index = 0; index < oThis.channelTagIds.length; index++) {
      promisesArray.push(
        ChannelTagVideoModel.flushCache({ channelId: oThis.channelId, tagId: oThis.channelTagIds[index] })
      );
    }

    await Promise.all(promisesArray);
  }
}

new PinVideoInChannel({
  channelId: program.channelId,
  videoId: program.videoId,
  unpin: program.unpin
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });

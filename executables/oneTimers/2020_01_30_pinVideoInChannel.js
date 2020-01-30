const program = require('commander');

const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  ChannelTagVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTagVideo'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

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
   * Constructor to associate a new tag with channel.
   *
   * @param {object} params
   * @param {number} params.channelId
   * @param {number} params.videoId
   * @param {Boolean} params.unpin
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
  }

  async perform() {
    const oThis = this;

    await oThis.validateChannel();

    await oThis.validateChannelVideo();

    await oThis.pinChannelVideo();

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
   * Fetch and Validate channel Tag.
   *
   * @sets oThis.channelId
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

    logger.info(`Channel Video validation done`);
  }

  /**
   * Pin Channel Video.
   *
   * @returns {Promise<never>}
   * @private
   */
  async pinChannelVideo() {
    const oThis = this;
    //  update channel videos

    const updateRes = await new ChannelVideoModel()
      .update({ pinned_at: oThis.pinnedAtVal })
      .where({ id: oThis.channelVideo.id })
      .fire();

    await ChannelVideoModel.flushCache({ channelId: oThis.channelId, videoId: oThis.videoId });
  }

  /**
   * Pin Channel Tag Video.
   *
   * @returns {Promise<never>}
   * @private
   */
  async pinChannelTagVideo() {
    const oThis = this;
    //  update channel tag videos

    await new ChannelTagVideoModel()
      .update({ pinned_at: oThis.pinnedAtVal })
      .where({
        channel_id: oThis.channelId,
        video_id: oThis.videoId
      })
      .fire();

    //todo:channels  if needed..!! get tags of a video and use it in query
    await ChannelTagVideoModel.flushCache({ channelId: oThis.channelId, videoId: oThis.videoId });
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

const program = require('commander');

const rootPrefix = '../..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');
(basicHelper = require(rootPrefix + '/helpers/basic')),
  (responseHelper = require(rootPrefix + '/lib/formatter/response')),
  (cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses'));

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(' node executables/channels/channelTrendingRankGenerator.js' + ' --cronProcessId 51');
  logger.log('');
  logger.log('');
});

`node executables/channels/channelTrendingRankGenerator.js --cronProcessId 51`;

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

const ACTIVITY_DURATION = 7 * 24 * 60 * 60; // one week

class ChannelTrendingRankGenerator extends CronBase {
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.channelIds = [];
    oThis.channelUsersCount = {};
    oThis.channelPostsCount = {};
  }

  async _start() {
    const oThis = this;

    oThis.canExit = false;
    logger.info('Staring channel trending rank generator');

    await oThis._getAllActiveChannels();
    await oThis._countAllRecentlyJoinedChannelUsers();
    await oThis._countAllRecentlyPostedVideos();

    oThis.canExit = true;

    return responseHelper.successWithData({});
  }

  /**
   * Fetch active channel ids.
   *
   * Sets oThis.channelIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getAllActiveChannels() {
    const oThis = this;
    const records = await new ChannelModel()
      .select('id')
      .where({
        status: channelConstants.invertedStatuses[channelConstants.activeStatus]
      })
      .fire();

    for (let i = 0; i < records.length; i++) {
      oThis.channelIds.push(records[i].id);
    }
  }

  /**
   *  Count channel users who are joined recently.
   *
   * sets oThis.channelUsersCount
   *
   * @returns {Promise<void>}
   * @private
   */
  async _countAllRecentlyJoinedChannelUsers() {
    const oThis = this;

    const records = await new ChannelUserModel()
      .select('channel_id, count(user_id) as userCount')
      .where({
        status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus]
      })
      .where({ channel_id: oThis.channelIds })
      .where(['created_at >= ?', basicHelper.getCurrentTimestampInSeconds() - ACTIVITY_DURATION])
      .group_by(['channel_id'])
      .fire();

    for (let i = 0; i < records.length; i++) {
      oThis.channelUsersCount[records[i].channel_id] = records[i].userCount;
    }
  }

  /**
   * Count post in channel
   *
   * sets oThis.channelPostsCount
   *
   * @returns {Promise<void>}
   * @private
   */
  async _countAllRecentlyPostedVideos() {
    const oThis = this;

    const records = await new ChannelVideoModel()
      .select('channel_id, count(video_id) as videoCount')
      .where({
        status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
      })
      .where({ channel_id: oThis.channelIds })
      .where(['created_at >= ?', basicHelper.getCurrentTimestampInSeconds() - ACTIVITY_DURATION])
      .group_by(['channel_id'])
      .fire();

    for (let i = 0; i < records.length; i++) {
      oThis.channelPostsCount[records[i].channel_id] = records[i].videoCount;
    }
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @returns {boolean}
   * @private
   */
  _pendingTasksDone() {
    const oThis = this;

    return oThis.canExit;
  }

  /**
   * Run validations on input parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    // Do nothing.
  }

  /**
   * Get cron kind.
   *
   * @returns {string}
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.channelTrendingRankGenerator;
  }
}

const channelTrendingRankGenerator = new ChannelTrendingRankGenerator({ cronProcessId: +cronProcessId });

channelTrendingRankGenerator
  .perform()
  .then(function() {
    logger.step('** Exiting process');
    logger.info('Cron last run at: ', Date.now());
    process.emit('SIGINT');
  })
  .catch(function(err) {
    logger.error('** Exiting process due to Error: ', err);
    process.emit('SIGINT');
  });

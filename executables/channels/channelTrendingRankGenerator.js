const program = require('commander');

const rootPrefix = '../..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelTrendingCache = require(rootPrefix + '/lib/cacheManagement/single/channel/ChannelTrending'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  TransactionModel = require(rootPrefix + '/app/models/mysql/Transaction'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses');

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
const BATCH_SIZE = 100;

class ChannelTrendingRankGenerator extends CronBase {
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.recentTimestampInSec = basicHelper.getCurrentTimestampInSeconds() - ACTIVITY_DURATION;
    oThis.channelIds = [];

    oThis.channelMetric = {};
    oThis.videoMetric = {};
    oThis.replyMetric = {};

    oThis.channelRankMetric = {};
    oThis.channelRank = {};
  }

  async _start() {
    const oThis = this;

    oThis.canExit = false;
    logger.info('Staring channel trending rank generator');

    await oThis._getAllActiveChannels();

    const promises = [
      oThis._countAllRecentlyJoinedChannelUsers(),
      oThis._countAllRecentlyPostedVideos(),
      oThis._getAllReplyForVideos()
    ];

    await Promise.all(promises);

    // This will populate video metric with transactionCount and reply
    // metric with transaction Count
    await oThis._getAllTransactions();

    // This will aggregate reply from same video
    // merged replyTransactionCount and  transactionCount.
    await oThis._associateReplyWithVideos();

    // This will aggregate videos from same channel and merged
    // transactionCount, replyTransactionCount and replyCount
    await oThis._associateVideoWithChannels();

    // Creates individual ranks by user, post, reply and transactions
    await oThis._createChannelRankMetric();

    // Create final rank for a channel by score calculation logic.
    await oThis._rankChannels();

    // Update Trending Rank for channels
    await oThis._updateTrendingRankInChannels();

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
      oThis.channelMetric[records[i].id] = {
        userCount: 0,
        postCount: 0,
        replyCount: 0,
        transactionCount: 0
      };
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
      .where(['created_at >= ?', oThis.recentTimestampInSec])
      .group_by(['channel_id'])
      .fire();

    for (let i = 0; i < records.length; i++) {
      oThis.channelMetric[records[i].channel_id] = {
        ...oThis.channelMetric[records[i].channel_id],
        userCount: records[i].userCount
      };
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
      .where(['created_at >= ?', oThis.recentTimestampInSec])
      .group_by(['channel_id'])
      .fire();

    for (let i = 0; i < records.length; i++) {
      oThis.channelMetric[records[i].channel_id] = {
        ...oThis.channelMetric[records[i].channel_id],
        postCount: records[i].videoCount
      };
    }
  }

  /**
   * fetch reply count for metrics
   *
   * sets oThis.videoMetric
   * @returns {Promise<void>}
   * @private
   */
  async _getAllReplyForVideos() {
    const oThis = this;

    const records = await new ReplyDetailModel()
      .select('parent_id as video_id, count(id) as replyCount')
      .where({ status: replyDetailConstants.activeStatus })
      .where({
        parent_kind: replyDetailConstants.invertedEntityKinds[replyDetailConstants.videoParentKind]
      })
      .where({
        entity_kind: replyDetailConstants.invertedEntityKinds[replyDetailConstants.videoEntityKind]
      })
      .where(['created_at >= ?', oThis.recentTimestampInSec])
      .group_by(['parent_id'])
      .fire();

    for (let i = 0; i < records.length; i++) {
      oThis.videoMetric[records[i].video_id] = {
        ...oThis.videoMetric[records[i].video_id],
        replyCount: records[i].replyCount,
        transactionCount: 0,
        replyTransactionCount: 0
      };
    }
  }

  /**
   * fetch all transactions.
   *
   * sets oThis.videoMetric and oThis.replyMetric
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getAllTransactions() {
    const oThis = this;

    const records = await new TransactionModel()
      .select('min(id) as minId')
      .where({
        kind: [
          transactionConstants.invertedKinds[transactionConstants.userTransactionKind],
          transactionConstants.invertedKinds[transactionConstants.userTransactionOnReplyKind]
        ]
      })
      .where({ status: transactionConstants.doneStatus })
      .where(['created_at >= ?', oThis.recentTimestampInSec])
      .order_by('id asc')
      .fire();

    if (records.length === 0) {
      return;
    }

    let minId = records[0].minId;

    if (!minId) {
      return;
    }

    while (true) {
      const batchRecords = await new TransactionModel()
        .select('*')
        .where({
          kind: [
            transactionConstants.invertedKinds[transactionConstants.userTransactionKind],
            transactionConstants.invertedKinds[transactionConstants.userTransactionOnReplyKind]
          ]
        })
        .where({ status: transactionConstants.doneStatus })
        .where(['id >= ?', minId])
        .order_by('id asc')
        .limit(BATCH_SIZE)
        .fire();

      if (batchRecords.length === 0) {
        break;
      }

      for (let i = 0; i < batchRecords.length; i++) {
        const transactionRow = TransactionModel.formatDbData(batchRecords[i]);

        if (transactionRow.kind === transactionConstants.userTransactionKind) {
          const videoId = transactionRow.extraData.videoId;
          if (videoId) {
            oThis.videoMetric[videoId] = oThis.videoMetric[videoId] || {
              replyCount: 0,
              transactionCount: 0,
              replyTransactionCount: 0
            };

            oThis.videoMetric[videoId].transactionCount++;
          }
        } else if (transactionRow.kind === transactionConstants.userTransactionOnReplyKind) {
          const replyId = transactionRow.extraData.replyDetailId;
          if (replyId) {
            oThis.replyMetric[replyId] = oThis.replyMetric[replyId] || {
              transactionCount: 0
            };

            oThis.replyMetric[replyId].transactionCount++;
          }
        }
      }

      minId = Number(batchRecords[batchRecords.length - 1].id) + 1;
    }
  }

  /**
   * Aggregate reply metric for video.
   *
   * sets oThis.videoMetric[records[i].videoId].replyTransactionCount
   * @returns {Promise<void>}
   * @private
   */
  async _associateReplyWithVideos() {
    const oThis = this;

    const replyIds = Object.keys(oThis.replyMetric);

    if (replyIds.length === 0) {
      return;
    }

    let index = 0;

    while (true) {
      const batchReplyIds = replyIds.slice(index, index + BATCH_SIZE);

      if (batchReplyIds.length === 0) {
        return;
      }

      const records = await new ReplyDetailModel()
        .select('id, parent_id as videoId')
        .where({ id: batchReplyIds })
        .fire();

      for (let i = 0; i < records.length; i++) {
        oThis.videoMetric[records[i].videoId] = oThis.videoMetric[records[i].videoId] || {
          replyCount: 0,
          transactionCount: 0,
          replyTransactionCount: 0
        };

        oThis.videoMetric[records[i].videoId].replyTransactionCount +=
          oThis.replyMetric[records[i].id].transactionCount;
      }
      index = index + BATCH_SIZE;
    }
  }

  /**
   * Aggregate video metric for each channel.
   *
   *
   * @private
   */
  async _associateVideoWithChannels() {
    const oThis = this;

    const videoIds = Object.keys(oThis.videoMetric);

    if (videoIds.length === 0) {
      return;
    }

    let index = 0;

    while (true) {
      const batchVideoIds = videoIds.slice(index, index + BATCH_SIZE);

      if (batchVideoIds.length === 0) {
        return;
      }

      const records = await new ChannelVideoModel()
        .select('id, channel_id, video_id')
        .where({
          status: channelVideosConstants.invertedStatuses[channelVideosConstants.activeStatus]
        })
        .where({ video_id: batchVideoIds })
        .where({ channel_id: oThis.channelIds })
        .fire();

      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        oThis.channelMetric[record.channel_id].transactionCount +=
          oThis.videoMetric[record.video_id].transactionCount +
          oThis.videoMetric[record.video_id].replyTransactionCount;

        oThis.channelMetric[record.channel_id].replyCount += oThis.videoMetric[record.video_id].replyCount;
      }
      index = index + BATCH_SIZE;
    }
  }

  /**
   *
   * Evaluate individual rank by user, post, reply and transactions.
   * sets oThis.channelRankMetric
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createChannelRankMetric() {
    const oThis = this;

    const channelIds = oThis.channelIds;

    // sort channel by user
    channelIds.sort(function(c1, c2) {
      const val = -(oThis.channelMetric[c1].userCount - oThis.channelMetric[c2].userCount);
      return val == 0 ? -(c1 - c2) : val;
    });

    for (let i = 0; i < channelIds.length; i++) {
      oThis.channelRankMetric[channelIds[i]] = oThis.channelRankMetric[channelIds[i]] || {
        rankByUser: -1,
        rankByPost: -1,
        rankByReply: -1,
        rankByTransaction: -1,
        totalScore: -1
      };

      oThis.channelRankMetric[channelIds[i]].rankByUser = i + 1;
    }

    // sort channel by posts
    channelIds.sort(function(c1, c2) {
      const val = -(oThis.channelMetric[c1].postCount - oThis.channelMetric[c2].postCount);
      return val == 0 ? -(c1 - c2) : val;
    });

    for (let i = 0; i < channelIds.length; i++) {
      oThis.channelRankMetric[channelIds[i]].rankByPost = i + 1;
    }

    // sort channel by reply
    channelIds.sort(function(c1, c2) {
      const val = -(oThis.channelMetric[c1].replyCount - oThis.channelMetric[c2].replyCount);
      return val == 0 ? -(c1 - c2) : val;
    });

    for (let i = 0; i < channelIds.length; i++) {
      oThis.channelRankMetric[channelIds[i]].rankByReply = i + 1;
    }

    // sort channel by transactions
    channelIds.sort(function(c1, c2) {
      const val = -(oThis.channelMetric[c1].transactionCount - oThis.channelMetric[c2].transactionCount);
      return val == 0 ? -(c1 - c2) : val;
    });

    for (let i = 0; i < channelIds.length; i++) {
      oThis.channelRankMetric[channelIds[i]].rankByTransaction = i + 1;
    }
  }

  /**
   * Evaluate final channel rank
   *
   * Sets oThis.channelRank
   *
   * @returns {Promise<void>}
   * @private
   */
  async _rankChannels() {
    const oThis = this;

    for (let i = 0; i < oThis.channelIds.length; i++) {
      const channelId = oThis.channelIds[i];
      const rankData = oThis.channelRankMetric[channelId];

      oThis.channelRankMetric[channelId].totalScore =
        rankData.rankByUser * 0.2 +
        rankData.rankByPost * 0.25 +
        rankData.rankByReply * 0.25 +
        rankData.rankByTransaction * 0.3;
    }

    const channelIds = oThis.channelIds;

    channelIds.sort(function(c1, c2) {
      const val = oThis.channelRankMetric[c1].totalScore - oThis.channelRankMetric[c2].totalScore;
      return val == 0 ? -(c1 - c2) : val;
    });

    for (let i = 0; i < channelIds.length; i++) {
      oThis.channelRank[channelIds[i]] = i + 1;
    }

    const header = [
      'channelId',
      'userCount',
      'rankByUser',
      'postCount',
      'rankByPost',
      'replyCount',
      'rankByReply',
      'transactionCount',
      'rankByTransaction',
      'totalScore',
      'channelRank'
    ];

    let logData = 'REPORT DATA FOR TRENDING\n';

    logData = logData + header.join(',') + '\n';

    for (let i = 0; i < oThis.channelIds.length; i++) {
      const channelId = oThis.channelIds[i];
      const rankData = oThis.channelRankMetric[channelId];
      const metricData = oThis.channelMetric[channelId];

      const data = [
        channelId,
        metricData.userCount,
        rankData.rankByUser,
        metricData.postCount,
        rankData.rankByPost,
        metricData.replyCount,
        rankData.rankByReply,
        metricData.transactionCount,
        rankData.rankByTransaction,
        rankData.totalScore,
        oThis.channelRank[channelId]
      ];
      logData = logData + data.join(',') + '\n';
    }

    logger.debug(logData);
  }

  /**
   * Update Trending Rank for channels
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTrendingRankInChannels() {
    const oThis = this;

    let promises = [];
    let channelIds = [];

    for (let i = 0; i < oThis.channelIds.length; i++) {
      const channelId = oThis.channelIds[i];
      channelIds.push(channelId);

      const promise = new ChannelModel()
        .update({ trending_rank: oThis.channelRank[channelId] })
        .where({ id: channelId })
        .fire();
      promises.push(promise);

      if (promises.length == BATCH_SIZE) {
        await Promise.all(promises);
        await new ChannelByIdsCache({ ids: channelIds }).clear();
        channelIds = [];
        promises = [];
      }
    }

    if (channelIds.length > 0) {
      await Promise.all(promises);
      await new ChannelByIdsCache({ ids: channelIds }).clear();
    }

    await new ChannelTrendingCache({}).clear();
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

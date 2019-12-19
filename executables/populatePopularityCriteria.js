const program = require('commander'),
  BigNumber = require('bignumber.js');

const rootPrefix = '..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  LatestFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LatestFeed'),
  DynamicVariablesModel = require(rootPrefix + '/app/models/mysql/DynamicVariables'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  dynamicVariablesConstants = require(rootPrefix + '/lib/globalConstant/dynamicVariables');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/populatePopularityCriteria --cronProcessId 13');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

const ninetiethPercentile = 0.9;

class PopulatePopularityCriteria extends CronBase {
  constructor(params) {
    super(params);
    const oThis = this;
    oThis.canExit = true;

    oThis.videoDetailsMapByVideoId = {};
    oThis.feedsMap = {};
    oThis.pepoValuePopularityThreshold = null;
    oThis.totalRepliesPopularityThreshold = null;
    oThis.markAsPopularFeedIds = [];
    oThis.markAsUnpopularFeedIds = [];
  }

  /**
   * Validate and sanitize.
   *
   * @private
   */
  _validateAndSanitize() {
    // Do nothing.
  }

  /**
   * Main function.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _start() {
    const oThis = this;

    oThis.canExit = false;

    await oThis._fetchLatestFeedAndVideoDetails();

    await oThis._setPopularityThreshold();

    await oThis._getPopularAndUnpopularFeedIds();

    await oThis._markPopularUnpopular();

    oThis.canExit = true;

    return responseHelper.successWithData({});
  }

  /**
   * Fetch latest feed data.
   *
   * @sets oThis.videoIds, oThis.videoIdToFeedMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchLatestFeedAndVideoDetails() {
    const oThis = this;

    const videoIds = [];
    const latestFeedCacheResp = await new LatestFeedCache().fetch();

    if (latestFeedCacheResp.isFailure()) {
      return Promise.reject(latestFeedCacheResp);
    }

    const latestFeedCacheRespData = latestFeedCacheResp.data;

    oThis.feedsMap = latestFeedCacheRespData.feedsMap;

    for (let feedId in oThis.feedsMap) {
      const videoId = oThis.feedsMap[feedId].primaryExternalEntityId;
      videoIds.push(videoId);
    }

    if (videoIds.length === 0) {
      return;
    }

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: videoIds }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetailsMapByVideoId = videoDetailsCacheResponse.data;
  }

  /**
   * Get pepo value popularity threshold.
   *
   * @sets oThis.pepoValuePopularityThreshold
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setPopularityThreshold() {
    const oThis = this;

    let totalContributionsArr = [],
      totalRepliesArr = [];

    for (let vid in oThis.videoDetailsMapByVideoId) {
      const videoDetail = oThis.videoDetailsMapByVideoId[vid];
      totalContributionsArr.push(videoDetail.totalAmount);
      totalRepliesArr.push(videoDetail.totalReplies);
    }

    totalContributionsArr = basicHelper.sortNumbers(totalContributionsArr);
    totalRepliesArr = basicHelper.sortNumbers(totalRepliesArr);

    const popularityIndex = oThis._ninetiethPercentileIndex(totalContributionsArr.length);
    logger.debug('oThis._ninetiethPercentileIndex === ', popularityIndex);
    logger.debug('totalContributionsArr[popularityIndex] === ', totalContributionsArr[popularityIndex]);
    logger.debug('totalRepliesArr[popularityIndex] === ', totalRepliesArr[popularityIndex]);

    if (
      new BigNumber(totalContributionsArr[popularityIndex]).gte(
        new BigNumber(videoDetailsConstants.minPepoAmountForPopularVideo)
      )
    ) {
      oThis.pepoValuePopularityThreshold = totalContributionsArr[popularityIndex];
    } else {
      oThis.pepoValuePopularityThreshold = videoDetailsConstants.minPepoAmountForPopularVideo;
    }

    if (totalContributionsArr[popularityIndex] > videoDetailsConstants.minNoOfRepliesForPopularVideo) {
      oThis.totalRepliesPopularityThreshold = totalRepliesArr[popularityIndex];
    } else {
      oThis.totalRepliesPopularityThreshold = videoDetailsConstants.minNoOfRepliesForPopularVideo;
    }

    const promises = [];

    let promise1 = new DynamicVariablesModel()
      .update({ value: oThis.pepoValuePopularityThreshold })
      .where({ kind: dynamicVariablesConstants.invertedKinds[dynamicVariablesConstants.pepoValuePopularityThreshold] })
      .fire()
      .then(async function(updateResp) {
        if (updateResp.affectedRows === 0) {
          await new DynamicVariablesModel()
            .insert({
              value: oThis.pepoValuePopularityThreshold,
              kind: dynamicVariablesConstants.invertedKinds[dynamicVariablesConstants.pepoValuePopularityThreshold]
            })
            .fire();
        }
      });

    let promise2 = new DynamicVariablesModel()
      .update({ value: oThis.totalRepliesPopularityThreshold })
      .where({
        kind: dynamicVariablesConstants.invertedKinds[dynamicVariablesConstants.numberOfRepliesPopularityThreshold]
      })
      .fire()
      .then(async function(updateResp) {
        if (updateResp.affectedRows === 0) {
          await new DynamicVariablesModel()
            .insert({
              value: oThis.totalRepliesPopularityThreshold,
              kind:
                dynamicVariablesConstants.invertedKinds[dynamicVariablesConstants.numberOfRepliesPopularityThreshold]
            })
            .fire();
        }
      });

    promises.push(promise1);
    promises.push(promise2);

    await Promise.all(promises);
    await DynamicVariablesModel.flushCache({
      kinds: [
        dynamicVariablesConstants.numberOfRepliesPopularityThreshold,
        dynamicVariablesConstants.pepoValuePopularityThreshold
      ]
    });
  }

  /**
   * Get popular and popular feed ids based on given threshold.
   *
   * @sets oThis.popularFeedIds, oThis.unpopularFeedIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getPopularAndUnpopularFeedIds() {
    const oThis = this;

    for (let feedId in oThis.feedsMap) {
      const feedObj = oThis.feedsMap[feedId],
        videoId = feedObj.primaryExternalEntityId,
        videoDetail = oThis.videoDetailsMapByVideoId[videoId];

      const isPopular =
        new BigNumber(videoDetail.totalAmount).gte(new BigNumber(oThis.pepoValuePopularityThreshold)) ||
        videoDetail.totalReplies >= oThis.totalRepliesPopularityThreshold;

      if (isPopular) {
        if (!feedObj.isPopular) {
          oThis.markAsPopularFeedIds.push(feedId);
        }
      } else {
        if (feedObj.isPopular) {
          oThis.markAsUnpopularFeedIds.push(feedId);
        }
      }
    }
  }

  /**
   * Mark feeds popular and unpopular.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markPopularUnpopular() {
    const oThis = this;

    const promises = [];

    if (oThis.markAsPopularFeedIds.length) {
      const promise1 = new FeedModel()
        .update({ is_popular: 1 })
        .where({ id: oThis.markAsPopularFeedIds })
        .fire();
      promises.push(promise1);
    }

    if (oThis.markAsUnpopularFeedIds.length) {
      const promise2 = new FeedModel()
        .update({ is_popular: 0 })
        .where({ id: oThis.markAsUnpopularFeedIds })
        .fire();
      promises.push(promise2);
    }

    await Promise.all(promises);

    const feedIds = oThis.markAsPopularFeedIds.concat(oThis.markAsUnpopularFeedIds);

    //flush only updated feeds and not all ids
    await FeedModel.flushCache({ ids: feedIds });
  }

  /**
   * Get ninetieth percentile index.
   *
   * @param {Number} rowsFetched
   * @returns {number}
   * @private
   */
  _ninetiethPercentileIndex(rowsFetched) {
    return Math.floor(rowsFetched * ninetiethPercentile);
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @returns {boolean}
   * @private
   */
  _pendingTasksDone() {
    const oThis = this;

    // Once sigint is received we will not process the next batch of rows.
    return oThis.canExit;
  }

  /**
   * Get cron kind.
   *
   * @returns {string}
   *
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.populatePopularityCriteria;
  }
}

const populatePopularityCriteriaObj = new PopulatePopularityCriteria({ cronProcessId: +cronProcessId });

populatePopularityCriteriaObj
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

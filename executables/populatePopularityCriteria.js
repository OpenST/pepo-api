const program = require('commander'),
  BigNumber = require('bignumber.js');

const rootPrefix = '..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  LatestFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LatestFeed'),
  DynamicVariablesModel = require(rootPrefix + '/app/models/mysql/DynamicVariables'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  dynamicVariablesConstants = require(rootPrefix + '/lib/globalConstant/dynamicVariables');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/PopulatePopularityCriteria.js --cronProcessId 13');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

const ninetiethPercentile = 0.1;

class PopulatePopularityCriteria extends CronBase {
  constructor(params) {
    super(params);
    const oThis = this;
    oThis.canExit = true;

    oThis.videoIds = [];
    oThis.videoIdToFeedMap = {};
    oThis.pepoValuePopularityThreshold = null;
    oThis.totalRepliesPopularityThreshold = null;
    oThis.popularFeedIds = [];
    oThis.unpopularFeedIds = [];
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

    // Fetch latest feed and Collect video ids.
    await oThis._fetchLatestFeed();

    const promiseArray = [];
    promiseArray.push(oThis._setPepoValuePopularityThreshold());

    // select video details where video_id IN videoIds order by total_replies
    // Get some_count * 0.1(90th percentile) row
    promiseArray.push(oThis._setTotalRepliesPopularityThreshold());

    await Promise.all(promiseArray);

    // Loop over collected feeds, collect markPopular and markUnpopular feed ids array.
    await oThis._getPopularAndUnpopularFeedIds();

    await oThis._markPopularUnpopular();

    await oThis._flushCache();

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
  async _fetchLatestFeed() {
    const oThis = this;

    const latestFeedCacheResp = await new LatestFeedCache().fetch();

    if (latestFeedCacheResp.isFailure()) {
      return Promise.reject(latestFeedCacheResp);
    }

    const latestFeedCacheRespData = latestFeedCacheResp.data;

    const feedsMap = latestFeedCacheRespData.feedsMap;

    for (let feedId in feedsMap) {
      const videoId = feedsMap[feedId].primaryExternalEntityId;
      oThis.videoIds.push(videoId);
      oThis.videoIdToFeedMap[videoId] = feedId;
    }

    // Return if videoIds length === 0;
  }

  /**
   * Get pepo value popularity threshold.
   *
   * @sets oThis.pepoValuePopularityThreshold
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setPepoValuePopularityThreshold() {
    const oThis = this;

    const dbRows = await new VideoDetailModel()
      .select('*')
      .where({ video_id: oThis.videoIds })
      .order_by('total_amount desc')
      .fire();

    logger.debug('oThis._ninetiethPercentileIndex   =======', oThis._ninetiethPercentileIndex(dbRows.length));

    const dbRow = dbRows[oThis._ninetiethPercentileIndex(dbRows.length)];
    oThis.pepoValuePopularityThreshold = dbRow.total_amount;

    logger.debug('oThis.pepoValuePopularityThreshold   =======', oThis.pepoValuePopularityThreshold);

    const updateResp = await new DynamicVariablesModel()
      .update({ value: oThis.pepoValuePopularityThreshold })
      .where({ kind: dynamicVariablesConstants.invertedKinds[dynamicVariablesConstants.pepoValuePopularityThreshold] })
      .fire();

    if (updateResp.affectedRows === 0) {
      await new DynamicVariablesModel()
        .insert({
          value: oThis.pepoValuePopularityThreshold,
          kind: dynamicVariablesConstants.invertedKinds[dynamicVariablesConstants.pepoValuePopularityThreshold]
        })
        .fire();
    }
  }

  /**
   * Get total replies popularity threshold.
   *
   * @sets oThis.totalRepliesPopularityThreshold
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setTotalRepliesPopularityThreshold() {
    const oThis = this;

    const dbRows = await new VideoDetailModel()
      .select('*')
      .where({ video_id: oThis.videoIds })
      .order_by('total_replies desc')
      .fire();

    const dbRow = dbRows[oThis._ninetiethPercentileIndex(dbRows.length)];

    oThis.totalRepliesPopularityThreshold = dbRow.total_replies;

    logger.debug('oThis.totalRepliesPopularityThreshold   =======', oThis.totalRepliesPopularityThreshold);

    const updateResp = await new DynamicVariablesModel()
      .update({ value: oThis.totalRepliesPopularityThreshold })
      .where({
        kind: dynamicVariablesConstants.invertedKinds[dynamicVariablesConstants.numberOfRepliesPopularityThreshold]
      })
      .fire();

    if (updateResp.affectedRows === 0) {
      await new DynamicVariablesModel()
        .insert({
          value: oThis.totalRepliesPopularityThreshold,
          kind: dynamicVariablesConstants.invertedKinds[dynamicVariablesConstants.numberOfRepliesPopularityThreshold]
        })
        .fire();
    }
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

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: oThis.videoIds }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    const videoDetailsCacheResponseData = videoDetailsCacheResponse.data;

    for (let index = 0; index < oThis.videoIds.length; index++) {
      const videoId = oThis.videoIds[index],
        videoDetail = videoDetailsCacheResponseData[videoId],
        feedId = oThis.videoIdToFeedMap[videoId];

      if (
        new BigNumber(videoDetail.totalAmount).gte(new BigNumber(oThis.pepoValuePopularityThreshold)) ||
        videoDetail.totalReplies >= oThis.totalRepliesPopularityThreshold
      ) {
        oThis.popularFeedIds.push(feedId);
      } else {
        oThis.unpopularFeedIds.push(feedId);
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

    await new FeedModel()
      .update({ is_popular: 1 })
      .where({ id: oThis.popularFeedIds })
      .fire();

    await new FeedModel()
      .update({ is_popular: 0 })
      .where({ id: oThis.unpopularFeedIds })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this,
      promiseArray = [];

    const feedIds = oThis.popularFeedIds.concat(oThis.unpopularFeedIds);

    promiseArray.push(FeedModel.flushCache({ ids: feedIds }));
    promiseArray.push(
      DynamicVariablesModel.flushCache({
        kinds: [
          dynamicVariablesConstants.numberOfRepliesPopularityThreshold,
          dynamicVariablesConstants.pepoValuePopularityThreshold
        ]
      })
    );

    await Promise.all(promiseArray);
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

const rootPrefix = '../../..',
  PersonalizedFeedByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/PersonalizedFeedByUserId'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Constructor for VideoPlayStart.
 *
 * @class VideoPlayStart
 */
class VideoPlayStart {
  /**
   * Constructor for VideoPlayStart.
   *
   * @augments VideoPlayStart
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;
    logger.log('VideoPlayStart===========', params);

    let message = params.message;

    oThis.feedId = (message.payload || {})['feed_id'];
    oThis.videoId = (message.payload || {})['video_id'];
    oThis.userId = params.socketUserId;

    oThis.feedObj = null;
    oThis.userFeedIdsCacheData = null;
  }

  /**
   * Async performer.
   *
   * @returns {Promise<void>}
   * @private
   */
  async perform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchFeedIdsForUserFromCache();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.feedObj
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.videoId) ||
      !CommonValidators.validateNonZeroInteger(oThis.userId)
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_pb_fvv_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { feedId: oThis.feedId, videoId: oThis.videoId, userId: oThis.userId }
        })
      );
    }

    await oThis._fetchFeed();

    if (!CommonValidators.validateNonEmptyObject(oThis.feedObj)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_pb_fvv_vas_2',
          api_error_identifier: 'invalid_api_params',
          debug_options: { feedId: oThis.feedId, videoId: oThis.videoId, userId: oThis.userId }
        })
      );
    }
  }

  /**
   * Fetch Feed
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchFeed() {
    const oThis = this;

    if (CommonValidators.validateNonZeroInteger(oThis.feedId)) {
      const feedByIdsCacheResponse = await new FeedByIdsCache({ ids: [oThis.feedId] }).fetch();

      if (feedByIdsCacheResponse.isFailure()) {
        return Promise.reject(feedByIdsCacheResponse);
      }

      oThis.feedObj = feedByIdsCacheResponse.data[oThis.feedId];
    } else {
      //  fetch from video id
    }

    //  Validate if video id is different??
  }

  /**
   * Get User feed ids for unseen and seen from cache.
   *
   * @sets oThis.userFeedIdsCacheData
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchFeedIdsForUserFromCache() {
    const oThis = this;

    const cacheResp = await new PersonalizedFeedByUserIdCache({ userId: oThis.userId }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    if (CommonValidators.validateNonEmptyObject(cacheResp.data)) {
      oThis.userFeedIdsCacheData = cacheResp.data;
    } else {
      logger.log('No Personalized Feed Cache Found for User', oThis.userId);
      return responseHelper.successWithData({});
    }

    await oThis._setFeedIdsForUserInCache();
  }

  /**
   * Set cahe after marking feed as seen.
   *
   * @sets oThis.userFeedIdsCacheData
   *
   * @returns {Promise<*>}
   * @private
   */
  async _setFeedIdsForUserInCache() {
    const oThis = this;
    let unseenFeedIds = oThis.userFeedIdsCacheData['unseenFeedIds'],
      nextRenderIndex = oThis.userFeedIdsCacheData['nextRenderIndex'];
    let index = unseenFeedIds.indexOf(oThis.feedId);

    if (index > -1) {
      oThis.userFeedIdsCacheData['unseenFeedIds'].splice(index, 1);

      //has been rendered
      if (index < oThis.userFeedIdsCacheData['nextRenderIndex']) {
        oThis.userFeedIdsCacheData['nextRenderIndex'] -= 1;
        oThis.userFeedIdsCacheData['recentSeenFeedIds'].push(oThis.feedId);
      } else {
        oThis.userFeedIdsCacheData['seenFeedIds'].push(oThis.feedId);
      }
    } else {
      logger.error('Personalized Feed Cache Feed in not Found for User', oThis.userId, oThis.feedId);
      return responseHelper.successWithData({});
    }

    const cacheResp = await new PersonalizedFeedByUserIdCache({ userId: oThis.userId }).setCacheData(
      oThis.userFeedIdsCacheData
    );

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    return responseHelper.successWithData({});
  }
}

module.exports = VideoPlayStart;

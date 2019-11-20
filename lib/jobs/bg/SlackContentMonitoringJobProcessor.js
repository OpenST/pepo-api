const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  videoDetailConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  slackWrapper = require(rootPrefix + '/lib/slack/wrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

/**
 * Class for slack content monitoring job.
 *
 * @class SlackContentMonitoringJobProcessor
 */
class SlackContentMonitoringJobProcessor {
  /**
   * Constructor for slack content monitoring job.
   *
   * @param {object} params
   * @param {object} params.userId
   * @param {object} params.videoId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.videoId = params.videoId;

    oThis.userData = null;
    oThis.twitterUserObj = null;
    oThis.videoIds = [];
    oThis.videoUrl = null;
    oThis.updatedDateAndTime = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const promisesArray = [
      oThis._fetchUser(),
      oThis._fetchTwitterUser(),
      oThis.fetchVideoDetails(),
      oThis.prepareVideoText()
    ];
    await Promise.all(promisesArray);

    await oThis._sendSlackMessage();
  }

  /**
   * Fetch user.
   *
   * @sets oThis.userData
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheResponse = await new SecureUserCache({ id: oThis.userId }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.userData = cacheResponse.data || {};
  }

  /**
   * Fetch twitter user.
   *
   * @sets oThis.twitterUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTwitterUser() {
    const oThis = this;

    const twitterUserByUserIdsCacheResp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.userId]
    }).fetch();

    if (twitterUserByUserIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResp);
    }

    const twitterUserByUserIdObj = twitterUserByUserIdsCacheResp.data[oThis.userId];
    if (!twitterUserByUserIdObj.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b_scmjp_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: { userId: oThis.userId }
        })
      );
    }

    // Should always be present.
    const twitterUserId = twitterUserByUserIdObj.id;

    const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: [twitterUserId]
    }).fetch();
    if (twitterUserByIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByIdsCacheResp);
    }

    oThis.twitterUserObj = twitterUserByIdsCacheResp.data[twitterUserId];
  }

  /**
   * Fetch video details.
   *
   * @sets oThis.totalRows, oThis.videoIds, oThis.videoTextList
   *
   * @returns {Promise<*>}
   */
  async fetchVideoDetails() {
    const oThis = this;

    const whereClauseArray = [
      'creator_user_id = ? AND video_id = ? AND status NOT IN (?)',
      oThis.userId,
      oThis.videoId,
      videoDetailConstants.invertedStatuses[videoDetailConstants.deletedStatus]
    ];

    const dbRows = await new VideoDetailModel()
      .select('*')
      .where(whereClauseArray)
      .order_by('id desc')
      .fire();

    if (dbRows.length <= 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_b_sancjp_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: oThis.userId, debugText: 'No video record found for this user.' }
        })
      );
    }
  }

  /**
   * Get video url.
   *
   * @returns {Promise<*>}
   */
  async prepareVideoText() {
    const oThis = this;
    const cacheRsp = await new VideoByIdCache({ ids: [oThis.videoId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const urlTemplate = cacheRsp.data[oThis.videoId].urlTemplate;
    (oThis.videoUrl = shortToLongUrl.getFullUrl(urlTemplate, videoConstants.originalResolution)),
      (oThis.updatedDateAndTime = cacheRsp.data[oThis.videoId].updatedAt);
  }

  /**
   * Generate message.
   *
   * @returns {array}
   * @private
   */
  _generateMessage() {
    const oThis = this;

    const profileUrl = basicHelper.userProfilePrefixUrl() + '/' + oThis.userId;
    let message = `---------------------------------------------------------\n*Hi, We got a video from an existing User at PEPO. Please check the details about the videos and take actions accordingly*\n*User's Full Name:*: ${
      oThis.userData.name
    }\n*Username*: ${oThis.userData.userName}\n*Admin Profile URL*: ${profileUrl}\n*Twitter handle*: ${
      oThis.twitterUserObj.handle
    }\n*Email address*: ${oThis.userData.email}\n*VideoLink*: ${oThis.videoUrl}\n*UpdatedAt*: ${
      oThis.updatedDateAndTime
    }`;

    const blocks = [],
      separator = '-----------------------------------------------------------';
    blocks.push(slackConstants.addTextSection(message));
    blocks.push(slackConstants.addDeleteVideoSection(oThis.videoId));
    blocks.push(slackConstants.addTextSection(separator));

    return blocks;
  }

  /**
   * Send slack message.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendSlackMessage() {
    const oThis = this;

    const slackMessageParams = {
      channel: slackConstants.contentMonitoringChannelName,
      text:
        '*Hi, We got a video from an existing User at PEPO. Please check the details about the videos and take actions accordingly*',
      blocks: oThis._generateMessage()
    };

    return slackWrapper.sendMessage(slackMessageParams);
  }
}

module.exports = SlackContentMonitoringJobProcessor;

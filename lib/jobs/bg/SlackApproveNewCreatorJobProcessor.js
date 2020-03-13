const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
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
 * Class for slack approve new creator job.
 *
 * @class SlackApproveNewCreatorJobProcessor
 */
class SlackApproveNewCreatorJobProcessor {
  /**
   * Constructor for slack approve new creator job.
   *
   * @param {object} params
   * @param {object} params.userId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;

    oThis.userData = null;
    oThis.twitterUserObj = {};
    oThis.videoIds = [];
    oThis.videoTextMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const promisesArray = [oThis._fetchUser(), oThis._fetchTwitterUser(), oThis.fetchVideoDetails()];
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

    oThis.userData = cacheResponse.data;

    if (
      !CommonValidators.validateNonEmptyObject(oThis.userData) ||
      !UserModelKlass.isUserApprovedCreator(oThis.userData)
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b_sancjp_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: {
            userId: oThis.userId,
            userData: oThis.userData
          }
        })
      );
    }
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

    const twitterUserByUserIdObj = twitterUserByUserIdsCacheResp.data[oThis.userId],
      twitterUserId = twitterUserByUserIdObj.id;

    if (twitterUserId) {
      const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
        ids: [twitterUserId]
      }).fetch();
      if (twitterUserByIdsCacheResp.isFailure()) {
        return Promise.reject(twitterUserByIdsCacheResp);
      }

      oThis.twitterUserObj = twitterUserByIdsCacheResp.data[twitterUserId];
    }
  }

  /**
   * Fetch video details.
   *
   * @sets oThis.totalRows, oThis.videoIds, oThis.videoTextList
   *
   * @returns {Promise<*>}
   */
  async fetchVideoDetails() {
    const oThis = this,
      limit = 5;

    const whereClauseArray = [
      'creator_user_id = ? AND status NOT IN (?)',
      oThis.userId,
      videoDetailConstants.invertedStatuses[videoDetailConstants.deletedStatus]
    ];

    const dbRows = await new VideoDetailModel()
      .select('*')
      .where(whereClauseArray)
      .limit(limit)
      .order_by('id desc')
      .fire();

    oThis.totalRows = dbRows.length;

    if (oThis.totalRows <= 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_b_sancjp_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: oThis.userId, debugText: 'No video record found for this user.' }
        })
      );
    }

    for (let index = 0; index < oThis.totalRows; index++) {
      const videoDetail = dbRows[index];
      oThis.videoIds.push(videoDetail.video_id);
    }

    oThis.videoTextMap = await oThis.prepareVideoText();
  }

  /**
   * Prepare video text.
   *
   * @returns {Promise<*>}
   */
  async prepareVideoText() {
    const oThis = this;
    const cacheRsp = await new VideoByIdCache({ ids: oThis.videoIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const videoIdToTextMap = [];
    for (const videoId in cacheRsp.data) {
      const urlTemplate = cacheRsp.data[videoId].urlTemplate,
        url = shortToLongUrl.getFullUrl(urlTemplate, videoConstants.originalResolution),
        updatedDateAndTime = cacheRsp.data[videoId].updatedAt,
        textToDisplay = `*VideoLink*: ${url}\n*UpdatedAt*: ${basicHelper.timeStampInMinutesToDateTillSeconds(
          updatedDateAndTime
        )}`;

      videoIdToTextMap[videoId] = textToDisplay;
    }

    return videoIdToTextMap;
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

    let isDoubleOptInDone = false;

    if (!CommonValidators.isVarNullOrUndefined(oThis.userData.email)) {
      isDoubleOptInDone = true;
    }

    const blocks = [],
      separator = '*===================================*';
    blocks.push(slackConstants.addUserInfoSection(oThis.userData, oThis.twitterUserObj, profileUrl, false));
    blocks.push(slackConstants.addDividerSection);

    for (let i = 0; i < oThis.videoIds.length; i++) {
      let videoId = oThis.videoIds[i];
      blocks.push(slackConstants.addVideoLinkSection(oThis.videoTextMap[videoId], videoId));
      blocks.push(slackConstants.addDividerSection);
    }

    blocks.push(slackConstants.addApproveBlockSection(oThis.userId, isDoubleOptInDone));
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
      channel: slackConstants.approveNewCreatorsChannelName,
      text:
        '*Hi, We got a video from a new User at PEPO. Please check the details about the videos and take actions accordingly*',
      blocks: oThis._generateMessage()
    };

    return slackWrapper.sendMessage(slackMessageParams);
  }
}

module.exports = SlackApproveNewCreatorJobProcessor;

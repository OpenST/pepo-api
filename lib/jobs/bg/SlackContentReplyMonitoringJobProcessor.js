const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  slackWrapper = require(rootPrefix + '/lib/slack/wrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

/**
 * Class for slack content reply monitoring job.
 *
 * @class SlackContentReplyMonitoringJobProcessor
 */
class SlackContentReplyMonitoringJobProcessor {
  /**
   * Constructor for slack content monitoring job.
   *
   * @param {object} params
   * @param {object} params.userId
   * @param {object} params.parentVideoId
   * @param {object} params.replyDetailId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.parentVideoId = params.parentVideoId;
    oThis.replyDetailId = params.replyDetailId;

    oThis.userData = null;
    oThis.twitterUserObj = {};
    oThis.parentVideoCreatorUserId = null;
    oThis.videoIds = [];
    oThis.replyTextMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const promisesArray = [oThis._fetchUser(), oThis._fetchTwitterUser(), oThis.fetchParentVideoDetails()];
    await Promise.all(promisesArray);

    await oThis.fetchReplyDetails();

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

    oThis.userData = cacheResponse.data[oThis.userId];

    if (!CommonValidators.validateNonEmptyObject(oThis.userData)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b_scrmjp_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: { userId: oThis.userId }
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
   * Fetch parent video details
   *
   * @sets oThis.parentVideoCreatorUserId
   *
   * @returns {Promise<never>}
   */
  async fetchParentVideoDetails() {
    const oThis = this;

    const videoDetailsByVideoIdsCacheResp = await new VideoDetailsByVideoIdsCache({
      videoIds: [oThis.parentVideoId]
    }).fetch();

    if (videoDetailsByVideoIdsCacheResp.isFailure()) {
      return Promise.reject(videoDetailsByVideoIdsCacheResp);
    }

    let parentVideoDetails = videoDetailsByVideoIdsCacheResp.data[oThis.parentVideoId];

    if (!CommonValidators.validateNonEmptyObject(parentVideoDetails)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_b_sdrjp_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { parentId: oThis.parentVideoId, debugText: 'No parent video record found.' }
        })
      );
    }
    oThis.parentVideoCreatorUserId = parentVideoDetails.creatorUserId;
  }

  /**
   * Fetch reply details.
   *
   * @sets oThis.totalRows, oThis.videoIds, oThis.videoTextList
   *
   * @returns {Promise<*>}
   */
  async fetchReplyDetails() {
    const oThis = this;

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();

    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data for reply_detail_id:', oThis.replyDetailId);

      return Promise.reject(replyDetailCacheResp);
    }

    let replyDetail = replyDetailCacheResp.data[oThis.replyDetailId];

    if (!CommonValidators.validateNonEmptyObject(replyDetail)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_b_sdrjp_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: oThis.userId, debugText: 'No reply record found for this user.' }
        })
      );
    }

    oThis.videoIds.push(replyDetail.entityId);

    oThis.replyTextMap = await oThis.prepareReplyText();
  }

  /**
   * Prepare reply text.
   *
   * @returns {Promise<*>}
   */
  async prepareReplyText() {
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
        linkToConversationThread = `${basicHelper.replyConversationThreadUrlPrefix()}?videoId=${
          oThis.parentVideoId
        }&userId=${oThis.parentVideoCreatorUserId}`,
        textToDisplay = `*ReplyLink*: ${url}\n*Link to Conversation Thread*: ${linkToConversationThread}\n*UpdatedAt*: ${basicHelper.timeStampInMinutesToDateTillSeconds(
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

    const blocks = [],
      separator = '*===================================*';
    blocks.push(slackConstants.addUserInfoSection(oThis.userData, oThis.twitterUserObj, profileUrl, true));
    blocks.push(slackConstants.addDividerSection);

    for (let i = 0; i < oThis.videoIds.length; i++) {
      let videoId = oThis.videoIds[i];
      blocks.push(slackConstants.addReplyLinkSection(oThis.replyTextMap[videoId], oThis.replyDetailId));
    }
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
        '*Hi, We got a reply from a User at PEPO. Please check the details about the reply and take actions accordingly*',
      blocks: oThis._generateMessage()
    };

    return slackWrapper.sendMessage(slackMessageParams);
  }
}

module.exports = SlackContentReplyMonitoringJobProcessor;

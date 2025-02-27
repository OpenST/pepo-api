const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  slackWrapper = require(rootPrefix + '/lib/slack/wrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

/**
 * Class for slack live event monitoring job.
 *
 * @class SlackLiveEventMonitoringJobProcessor
 */
class SlackLiveEventMonitoringJobProcessor {
  /**
   * Constructor for slack live event monitoring job.
   *
   * @param {object} params
   * @param {Integer} params.channelId
   * @param {Integer} params.userId
   * @param {Boolean} params.errorGoingLive
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.channelId = params.channelId;
    oThis.errorGoingLive = params.errorGoingLive || false;

    oThis.userData = null;
    oThis.channelDetails = null;
    oThis.zoomMeetingId = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchChannelDetails();

    const promisesArray = [oThis._fetchChannelLiveMeeting(), oThis._fetchUser()];
    await Promise.all(promisesArray);

    await oThis._fetchAndValidateMeeting();

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

    if (!CommonValidators.validateNonEmptyObject(oThis.userData)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b_slemjp_1',
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
   * Fetch channel details
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelDetails() {
    const oThis = this;

    const channelByIdsCacheResp = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();

    if (channelByIdsCacheResp.isFailure()) {
      return Promise.reject(channelByIdsCacheResp);
    }

    oThis.channelDetails = channelByIdsCacheResp.data[oThis.channelId];
    if (!CommonValidators.validateNonEmptyObject(oThis.channelDetails)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b_slemjp_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: oThis.channelDetails
          }
        })
      );
    }
  }

  /**
   * Fetch live meeting of a channel.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelLiveMeeting() {
    const oThis = this;

    if (!oThis.errorGoingLive && !oThis.channelDetails.liveMeetingId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b_slemjp_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_meeting_id'],
          debug_options: {
            channelId: oThis.channelId
          }
        })
      );
    }

    oThis.meetingId = oThis.channelDetails.liveMeetingId;
  }

  /**
   * Fetch and validate meeting.
   *
   * @sets oThis.zoomMeetingId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateMeeting() {
    const oThis = this;

    const cacheResponse = await new MeetingByIdsCache({ ids: [oThis.meetingId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    let meeting = cacheResponse.data[oThis.meetingId];

    if (!CommonValidators.validateNonEmptyObject(meeting) || meeting.channelId != oThis.channelId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b_slemjp_4',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_meeting_id'],
          debug_options: {
            meetingId: oThis.meetingId,
            channelId: oThis.channelId
          }
        })
      );
    }

    oThis.zoomMeetingId = meeting.zoomMeetingId;
  }

  /**
   * Generate message to be posted on Slack.
   *
   * @returns {string}
   * @private
   */
  _generateMessage() {
    const oThis = this;

    const profileUrl = basicHelper.userProfilePrefixUrl() + '/' + oThis.userId;
    let message = null;

    // If there is an error
    if (oThis.errorGoingLive) {
      // For now as there is only one error scenario, we have kept the error text here.
      // We can change this to error kind and corresponding values later.
      const errorText = 'We have reached the live zoom limit.';
      message = `*Hi, Pepo Community is not able to go live : *\n
        *Community*: ${oThis.channelDetails.name}\n
        *Error*: ${errorText}\n
        *Community Admin*: ${oThis.userData.name}\n
        *Community Admin Profile Url*: ${profileUrl}`;
    } else {
      const meetingUrl =
          basicHelper.communitiesPrefixUrl() + '/' + oThis.channelDetails.permalink + '/meetings/' + oThis.meetingId,
        zoomMeetingUrl = meetingConstants.zoomMeetingPrefixUrl + oThis.zoomMeetingId;
      message = `*Hi, Pepo Community is now live : *\n
        *Community*: ${oThis.channelDetails.name}\n
        *Meeting Url*: ${meetingUrl}\n
        *Community Admin*: ${oThis.userData.name}\n
        *Community Admin Profile Url*: ${profileUrl}\n
        *Zoom meeting URL*: ${zoomMeetingUrl}`;
    }

    return message;
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
      channel: slackConstants.pepoLiveEventChannelName,
      text: oThis._generateMessage(),
      unfurl_links: false
    };

    return slackWrapper.sendMessage(slackMessageParams);
  }
}

module.exports = SlackLiveEventMonitoringJobProcessor;

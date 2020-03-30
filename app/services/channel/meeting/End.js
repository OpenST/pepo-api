const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  MeetingLib = require(rootPrefix + '/lib/zoom/meeting'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  MeetingEnded = require(rootPrefix + '/app/services/zoomEvents/meetings/Ended'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 *
 * End Meeting service. It ends the meeting in zoom as well as locally.
 *
 * @class EndMeeting
 */
class EndMeeting extends ServiceBase {
  /**
   * @param params
   * @param params.channel_permalink
   * @param params.current_user
   * @param params.meeting_id
   */
  constructor(params) {
    super();
    const oThis = this;

    oThis.channelPermalink = params.channel_permalink;
    oThis.currentUserId = (params.current_user || {}).id;
    oThis.meetingId = params.meeting_id;

    oThis.meeting = {};
    oThis.channelId = null;
    oThis.channel = {};
  }

  /**
   * Async perform. This will try to end zoom meeting and it will also end
   * zoom meeting locally. If it doesn't receive past meeting details from the
   * zoom, it will not update start and end timestamp of meeting. Meeting
   * relayer is marked as available if meeting is alive.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndValidateChannel();

    await oThis._validateMeeting();

    await oThis._endMeeting();
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channel, oThis.channelId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateChannel() {
    const oThis = this;
    const lowercaseChannelPermalink = oThis.channelPermalink.toLowerCase();
    const cacheResponse = await new ChannelByPermalinksCache({
      permalinks: [lowercaseChannelPermalink]
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }
    const permalinkIdsMap = cacheResponse.data;
    if (!CommonValidators.validateNonEmptyObject(permalinkIdsMap[lowercaseChannelPermalink])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_em_1',
          api_error_identifier: 'resource_not_found',
          debug_options: {
            channelPermalink: oThis.channelPermalink
          }
        })
      );
    }
    oThis.channelId = permalinkIdsMap[lowercaseChannelPermalink].id;
    const channelCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (channelCacheResponse.isFailure()) {
      return Promise.reject(channelCacheResponse);
    }
    oThis.channel = channelCacheResponse.data[oThis.channelId];
    if (
      !CommonValidators.validateNonEmptyObject(oThis.channel) ||
      oThis.channel.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_c_m_em_2',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: oThis.channel
          }
        })
      );
    }
  }

  /**
   * Validate whether the current user is hosting this meeting.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateMeeting() {
    const oThis = this;
    const cacheResponse = await new MeetingByIdsCache({ ids: [oThis.meetingId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }
    oThis.meeting = cacheResponse.data[oThis.meetingId];
    if (!CommonValidators.validateNonEmptyObject(oThis.meeting) || oThis.meeting.channelId !== oThis.channelId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_em_3',
          api_error_identifier: 'resource_not_found',
          debug_options: {
            channelPermalink: oThis.channelPermalink
          }
        })
      );
    }
    if (oThis.meeting.hostUserId != oThis.currentUserId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_em_4',
          api_error_identifier: 'resource_not_found',
          debug_options: {
            currentUserId: oThis.currentUserId,
            meetingHostId: oThis.meeting.hostUserId,
            meetingId: oThis.meeting.id
          }
        })
      );
    }
  }

  /**
   * End the meeting.
   *
   * @private
   */
  async _endMeeting() {
    const oThis = this;

    if (!oThis.meeting.isLive) {
      return;
    }

    const zoomMeetingId = oThis.meeting.zoomMeetingId;
    const zoomUUID = oThis.meeting.zoomUUID;

    logger.info(`Trying to ending zoom meeting ${zoomMeetingId}`);
    await MeetingLib.markEnd(zoomMeetingId).catch((e) => {
      logger.info(
        `Zoom meeting end call failed. Possibly meeting is already ended for zoomMeeting id ${
          oThis.meeting.zoomMeetingId
        }. API response status ${e.statusCode}`
      );
    });

    let isPastMeetingResponse = true;
    const pastMeetingResponse = await MeetingLib.getPastMeeting(zoomUUID).catch(async (e) => {
      isPastMeetingResponse = false;
      logger.error(`Error in fetching past meeting details for UUID ${zoomUUID} error status ${e.statusCode}`);
    });

    let startTime, endTime;

    if (isPastMeetingResponse) {
      logger.info(`Received response from zoom past meeting call zoomuuid ${zoomUUID}`);
      startTime = pastMeetingResponse.start_time;
      endTime = pastMeetingResponse.end_time;
    }

    const response = await new MeetingEnded({
      payload: {
        object: {
          id: zoomMeetingId,
          start_time: startTime,
          end_time: endTime
        }
      }
    }).perform();

    if (response.isFailure()) {
      logger.error(`Error in ending meeting zoom meeting id ${zoomMeetingId}`);

      return responseHelper.error({
        internal_error_identifier: 'a_s_c_m_em_7',
        api_error_identifier: 'something_went_wrong',
        debug_options: { zoomMeetingId: zoomMeetingId }
      });
    }
  }
}
module.exports = EndMeeting;

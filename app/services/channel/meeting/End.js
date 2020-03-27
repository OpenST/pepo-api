const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  MeetingLib = require(rootPrefix + '/lib/zoom/meeting'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  MeetingEnded = require(rootPrefix + '/app/services/zoomEvents/meetings/Ended'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/GetCurrentUserChannelRelations'),
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
    oThis.currentUser = params.current_user;
    oThis.meetingId = params.meeting_id;

    oThis.meeting = {};
    oThis.channelId = null;
    oThis.channel = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndValidateChannel();

    await oThis._validateMeeting();

    await oThis._validateUserIsChannelAdmin();

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
    if (!oThis.meeting.hostUserId !== oThis.currentUserId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_em_4',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {
            hostUserId: oThis.currentUserId,
            meetingId: oThis.meeting.id
          }
        })
      );
    }
  }

  /**
   * Fetch and validate user is channel admin.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateUserIsChannelAdmin() {
    const oThis = this;
    const currentUserChannelRelationLibParams = {
      currentUserId: oThis.currentUserId,
      channelIds: [oThis.channelId]
    };
    const currentUserChannelRelationsResponse = await new GetCurrentUserChannelRelationsLib(
      currentUserChannelRelationLibParams
    ).perform();
    if (currentUserChannelRelationsResponse.isFailure()) {
      return Promise.reject(currentUserChannelRelationsResponse);
    }
    const currentUserChannelRelations = currentUserChannelRelationsResponse.data.currentUserChannelRelations;
    if (!currentUserChannelRelations[oThis.channelId].isAdmin) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_em_5',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {
            channelId: oThis.channelId,
            currentUserId: oThis.currentUserId
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
    if (
      oThis.meeting.status === meetingConstants.endedStatus ||
      oThis.meeting.status === meetingConstants.deletedStatus
    ) {
      return;
    }
    const zoomMeetingId = oThis.meeting.zoomMeetingId;
    const zoomUUID = oThis.meeting.zoomUUID;
    await MeetingLib.markEnd(zoomMeetingId).catch((e) => {
      logger.info(
        `Zoom meeting end call failed. Possibly meeting is already ended for zoomMeeting id ${
          oThis.meeting.zoomMeetingId
        }. API response status ${e.statusCode}`
      );
    });
    let isError = false;
    const pastMeetingResponse = await MeetingLib.getPastMeeting(zoomUUID).catch(async (e) => {
      isError = true;
      logger.error(`Error in fetching past meeting details for UUID ${zoomUUID} error status ${e.statusCode}`);
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_c_m_em_6',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          zoomMeetingId: zoomMeetingId,
          zoomUUID: zoomUUID
        }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
    });
    if (!isError) {
      const response = await new MeetingEnded({
        payload: {
          object: {
            id: zoomMeetingId,
            start_time: pastMeetingResponse.start_time,
            end_time: pastMeetingResponse.end_time
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
}
module.exports = EndMeeting;

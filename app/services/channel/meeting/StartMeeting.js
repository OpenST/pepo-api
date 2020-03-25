const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  MeetingRelayerModel = require(rootPrefix + '/app/models/mysql/meeting/MeetingRelayer'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/GetCurrentUserChannelRelations'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  zoomMeetingLib = require(rootPrefix + '/lib/zoom/meeting'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  meetingRelayerConstants = require(rootPrefix + '/lib/globalConstant/meeting/meetingRelayer');

/**
 * Class to start channel meeting.
 *
 * @class StartMeeting
 */
class StartMeeting extends ServiceBase {
  /**
   * Constructor to start channel meeting.
   *
   * @param {object} params
   * @param {string} params.channel_permalink
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelPermalink = params.channel_permalink.toLowerCase();
    oThis.currentUserId = params.current_user.id;

    oThis.channelId = null;
    oThis.channel = {};

    oThis.meetingRelayer = null;

    oThis.zoomMeetingId = null;

    oThis.meetingId = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    // Channel validations.
    await oThis._fetchAndValidateChannel();

    const isMeetingLive = await oThis._validateChannelLiveMeeting();
    if (isMeetingLive) {
      return responseHelper.successWithData(oThis._prepareResponse());
    }

    // Validate channel user role and existing live meetings of current user.
    await Promise.all([oThis._validateChannelUser(), oThis._validateCurrentUserLiveMeetings()]);

    // Step 1: Reserve zoom user.
    await oThis._reserveZoomUser();

    // Step 2: Create meeting using Zoom API call. If it fails, revert the previous update.
    const meetingCreationResponse = await oThis._createMeetingUsingZoom();
    if (meetingCreationResponse.isFailure()) {
      await oThis._rollbackUpdates();

      return responseHelper.successWithData(oThis._prepareResponse());
    }

    // Step 3: Create a new record in the meetings table.
    // If the insert fails, revert the previous updates and delete the zoom meeting.
    const meetingRecordResponse = await oThis._recordMeetingInTable();
    if (meetingRecordResponse.isFailure()) {
      await oThis._rollbackUpdates();

      return responseHelper.successWithData(oThis._prepareResponse());
    }

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channelId, oThis.channel
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateChannel() {
    const oThis = this;

    const cacheResponse = await new ChannelByPermalinksCache({
      permalinks: [oThis.channelPermalink]
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const permalinkIdsMap = cacheResponse.data;

    if (!CommonValidators.validateNonEmptyObject(permalinkIdsMap[oThis.channelPermalink])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_sm_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelPermalink: oThis.channelPermalink
          }
        })
      );
    }

    oThis.channelId = permalinkIdsMap[oThis.channelPermalink].id;

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
          internal_error_identifier: 'a_s_c_m_sm_2',
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
   * Validate whether channel has an ongoing live meeting or not.
   *
   * @returns {*|result}
   * @private
   */
  _validateChannelLiveMeeting() {
    const oThis = this;

    let isMeetingLive = false;

    // A live meeting already exists for this channel.
    // If live meeting already exists, redirect user to the live meeting.
    if (oThis.channel.liveMeetingId) {
      oThis.meetingId = oThis.channel.liveMeetingId;

      isMeetingLive = true;
    }

    return isMeetingLive;
  }

  /**
   * Fetch and validate channel user.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateChannelUser() {
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
    // Only a channel admin can start a meeting.
    if (!currentUserChannelRelations[oThis.channelId].isAdmin) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_c_m_sm_3',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_channel_user_role'],
          debug_options: {
            channelId: oThis.channelId,
            currentUserChannelRelations: currentUserChannelRelations[oThis.channelId]
          }
        })
      );
    }
  }

  /**
   * Validate whether the current user is hosting any other meeting or not.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateCurrentUserLiveMeetings() {
    const oThis = this;

    const dbRows = await new MeetingModel()
      .select('id')
      .where({
        host_user_id: oThis.currentUserId,
        is_live: meetingConstants.isLiveStatus
      })
      .limit(1)
      .fire();

    if (dbRows.length > 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_sm_4',
          api_error_identifier: 'already_hosting_other_meetings',
          debug_options: { currentUserId: oThis.currentUserId }
        })
      );
    }
  }

  /**
   * Reserve zoom user.
   *
   * @sets oThis.meetingRelayer
   *
   * @returns {Promise<void>}
   * @private
   */
  async _reserveZoomUser() {
    const oThis = this;

    const dbRows = await new MeetingRelayerModel()
      .select('*')
      .where({ status: meetingRelayerConstants.invertedStatuses[meetingRelayerConstants.availableStatus] })
      .order_by('last_meeting_created_at ASC')
      .fire();

    const currentTimeInSeconds = basicHelper.timestampInSeconds();

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];

      const updateResponse = await new MeetingRelayerModel()
        .update({
          status: meetingRelayerConstants.invertedStatuses[meetingRelayerConstants.reservedStatus],
          last_meeting_created_at: currentTimeInSeconds
        })
        .where({
          id: dbRow.id,
          status: meetingRelayerConstants.invertedStatuses[meetingRelayerConstants.availableStatus]
        })
        .fire();

      if (updateResponse.affectedRows === 1) {
        oThis.meetingRelayer = new MeetingRelayerModel().formatDbData(dbRow);
        break;
      }
    }

    if (!oThis.meetingRelayer) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_sm_5',
          api_error_identifier: 'zoom_user_unavailable',
          debug_options: {}
        })
      );
    }
  }

  /**
   * Create meeting using zoom.
   *
   * @sets oThis.zoomMeetingId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createMeetingUsingZoom() {
    const oThis = this;

    if (!oThis.meetingRelayer) {
      return responseHelper.error({
        internal_error_identifier: 'a_s_c_m_sm_6',
        api_error_identifier: 'something_went_wrong',
        debug_options: {}
      });
    }

    let facedError = false;

    const zoomApiResponse = await zoomMeetingLib.create(oThis.meetingRelayer.zoomUserId).catch(function() {
      facedError = true;
    });

    if (facedError) {
      return responseHelper.error({
        internal_error_identifier: 'a_s_c_m_sm_7',
        api_error_identifier: 'something_went_wrong',
        debug_options: {}
      });
    }

    oThis.zoomMeetingId = zoomApiResponse.id;

    return responseHelper.successWithData({});
  }

  /**
   * Record meeting in table.
   *
   * @sets oThis.meetingId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _recordMeetingInTable() {
    const oThis = this;

    if (!oThis.zoomMeetingId) {
      return responseHelper.error({
        internal_error_identifier: 'a_s_c_m_sm_8',
        api_error_identifier: 'something_went_wrong',
        debug_options: {}
      });
    }

    const insertResponse = await new MeetingModel()
      .insert({
        host_user_id: oThis.currentUserId,
        meeting_relayer_id: oThis.meetingRelayer.id,
        channel_id: oThis.channelId,
        is_live: meetingConstants.isLiveStatus,
        zoom_meeting_id: oThis.zoomMeetingId,
        status: meetingConstants.invertedStatuses[meetingConstants.waitingStatus]
      })
      .fire();

    if (!insertResponse) {
      return responseHelper.error({
        internal_error_identifier: 'a_s_c_m_sm_9',
        api_error_identifier: 'something_went_wrong',
        debug_options: {}
      });
    }

    oThis.meetingId = insertResponse.insertId;

    await ChannelModel.flushCache({ ids: [oThis.channelId] });

    return responseHelper.successWithData({});
  }

  /**
   * Rollback updates in case of failure.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _rollbackUpdates() {
    const oThis = this;

    const promisesArray = [];

    if (oThis.meetingRelayer) {
      promisesArray.push(oThis._unReserveZoomUser());
    }

    if (oThis.zoomMeetingId) {
      promisesArray.push(oThis._deleteZoomMeeting());
    }

    await Promise.all(promisesArray);
  }

  /**
   * Un-reserve zoom user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _unReserveZoomUser() {
    const oThis = this;

    const updateResponse = await new MeetingRelayerModel()
      .update({
        status: meetingRelayerConstants.invertedStatuses[meetingRelayerConstants.availableStatus]
      })
      .where({ id: oThis.meetingRelayer.id })
      .fire();

    if (updateResponse.affectedRows === 0) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_c_m_sm_10',
        api_error_identifier: 'zoom_user_unreserving_failed',
        debug_options: { zoomUser: oThis.zoomUser }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }
  }

  /**
   * Delete zoom meeting.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteZoomMeeting() {
    const oThis = this;

    await zoomMeetingLib.delete(oThis.zoomMeetingId).catch(async function(error) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_c_m_sm_11',
        api_error_identifier: 'zoom_meeting_delete_failed',
        debug_options: { zoomMeetingId: oThis.zoomMeetingId, error: error }
      });

      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    });
  }

  /**
   * Prepare response.
   *
   * @returns {{}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return {
      [entityTypeConstants.startZoomMeetingPayload]: {
        meetingId: oThis.meetingId
      }
    };
  }
}

module.exports = StartMeeting;

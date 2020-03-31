const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting');

// Declare variables.
const dbName = databaseConstants.meetingDbName;

/**
 * Class for meeting model.
 *
 * @class MeetingModel
 */
class MeetingModel extends ModelBase {
  /**
   * Constructor for meeting model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'meetings';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.host_user_id
   * @param {number} dbRow.meeting_relayer_id
   * @param {number} dbRow.start_timestamp
   * @param {number} dbRow.end_timestamp
   * @param {number} dbRow.channel_id
   * @param {number} dbRow.zoom_meeting_id
   * @param {string} dbRow.zoom_uuid
   * @param {string} dbRow.recording_url
   * @param {string} dbRow.status
   * @param {number} dbRow.is_live
   * @param {number} dbRow.host_join_count
   * @param {number} dbRow.host_leave_count
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      hostUserId: dbRow.host_user_id,
      meetingRelayerId: dbRow.meeting_relayer_id,
      startTimestamp: dbRow.start_timestamp || null,
      endTimestamp: dbRow.end_timestamp || null,
      channelId: dbRow.channel_id,
      zoomMeetingId: dbRow.zoom_meeting_id,
      zoomUUID: dbRow.zoom_uuid,
      recordingUrl: dbRow.recording_url,
      isLive: dbRow.is_live,
      status: meetingConstants.statuses[dbRow.status],
      hostJoinCount: dbRow.host_join_count,
      hostLeaveCount: dbRow.host_leave_count,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch meeting objects for ids.
   *
   * @param {array} ids
   *
   * @return {object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ id: ids })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch meeting objects for zoom meeting ids.
   *
   * @param {array} zoomMeetingIds
   *
   * @return {object}
   */
  async fetchByZoomMeetingIds(zoomMeetingIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('id, zoom_meeting_id')
      .where({ zoom_meeting_id: zoomMeetingIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.zoomMeetingId] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch meeting objects for zoom uuids.
   *
   * @param {array} zoomUuids - zoom uuids.
   *
   * @return {object}
   */
  async fetchByZoomUuids(zoomUuids) {
    const oThis = this;

    const dbRows = await oThis
      .select('id, zoom_uuid')
      .where({ zoom_uuid: zoomUuids })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.zoomUUID] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch meeting id by channel ids.
   *
   * @param {array<number>} channelIds
   *
   * @returns {Promise<object>}
   */
  async fetchMeetingIdByChannelIds(channelIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('id, channel_id')
      .where({ channel_id: channelIds, is_live: meetingConstants.isLiveStatus })
      .fire();

    const response = {};

    for (let channelIdIndex = 0; channelIdIndex < channelIds.length; channelIdIndex++) {
      response[channelIds[channelIdIndex]] = { liveMeetingId: null };
    }

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];
      response[dbRow.channel_id].liveMeetingId = dbRow.id;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} [params.id]
   * @param {array<number>} [params.channelIds]
   * @param {array<number>} [params.channelId]
   * @param {array<number>} [params.zoomMeetingId]
   * @param {array<number>} [params.zoomUuid]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];
    let channelIds = [];

    if (params.channelIds) {
      channelIds = params.channelIds;
    }

    if (params.channelId) {
      channelIds.push(params.channelId);
    }

    if (params.id) {
      const MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds');
      promisesArray.push(new MeetingByIdsCache({ ids: [params.id] }).clear());
    }

    if (params.zoomMeetingId) {
      const MeetingIdByZoomMeetingIdsCache = require(rootPrefix +
        '/lib/cacheManagement/multi/meeting/MeetingIdByZoomMeetingIds');
      promisesArray.push(new MeetingIdByZoomMeetingIdsCache({ zoomMeetingIds: [params.zoomMeetingId] }).clear());
    }

    if (params.zoomUuid) {
      const MeetingIdByZoomMeetingIdsCache = require(rootPrefix +
        '/lib/cacheManagement/multi/meeting/MeetingIdByZoomUuids');
      promisesArray.push(new MeetingIdByZoomMeetingIdsCache({ zoomUuids: [params.zoomUuid] }).clear());
    }

    if (channelIds.length > 0) {
      const LiveMeetingIdByChannelIdsCache = require(rootPrefix +
        '/lib/cacheManagement/multi/meeting/LiveMeetingIdByChannelIds');
      promisesArray.push(new LiveMeetingIdByChannelIdsCache({ channelIds: channelIds }).clear());

      // We are clearing channel cache here because liveMeetingId is a part of channel entity.
      const ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds');

      promisesArray.push(new ChannelByIdsCache({ ids: channelIds }).clear());
    }

    // As live meeting would change the list here, so clearing that as well.
    const DefaultChannelsListForWeb = require(rootPrefix + '/lib/cacheManagement/single/DefaultChannelsListForWeb');
    await new DefaultChannelsListForWeb().clear();

    await Promise.all(promisesArray);
  }
}

module.exports = MeetingModel;

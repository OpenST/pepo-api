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
   * @param {number} dbRow.live_participants
   * @param {number} dbRow.cumulative_participants
   * @param {number} dbRow.channel_id
   * @param {number} dbRow.zoom_meeting_id
   * @param {string} dbRow.recording_url
   * @param {string} dbRow.status
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
      liveParticipants: dbRow.live_participants,
      cumulativeParticipants: dbRow.cumulative_participants,
      channelId: dbRow.channel_id,
      zoomMeetingId: dbRow.zoom_meeting_id,
      recordingUrl: dbRow.recording_url,
      status: meetingConstants.statuses[dbRow.status],
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
      .select('*')
      .where({ zoom_meeting_id: zoomMeetingIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
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
      .where({
        channel_id: channelIds
      })
      .where([
        'status IN (?)',
        [
          meetingConstants.invertedStatuses[meetingConstants.createdStatus],
          meetingConstants.invertedStatuses[meetingConstants.waitingStatus]
        ]
      ])
      .fire();

    const response = {};

    for (let channelIdIndex = 0; channelIdIndex < channelIds.length; channelIdIndex++) {
      response[channelIds[channelIdIndex]] = {
        liveMeetingId: null
      };
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
   * @returns {Promise<*>}
   */
  static async flushCache() {
    // Do nothing.
  }
}

module.exports = MeetingModel;

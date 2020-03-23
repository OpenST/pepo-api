const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables.
const dbName = databaseConstants.socialConnectDbName;

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
   * Flush cache
   *
   * @param {object} params
   * @param {number} params.twitterId
   * @param {number} params.id
   * @param {number} [params.userId]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = MeetingModel;

const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  meetingRelayerConstants = require(rootPrefix + '/lib/globalConstant/meeting/meetingRelayer');

// Declare variables.
const dbName = databaseConstants.meetingDbName;

/**
 * Class for meeting relayer model.
 *
 * @class MeetingRelayerModel
 */
class MeetingRelayerModel extends ModelBase {
  /**
   * Constructor for meeting relayer model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'meeting_relayers';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.zoom_user_id
   * @param {string} dbRow.email
   * @param {string} dbRow.status
   * @param {number} dbRow.last_meeting_created_at
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      zoomUserId: dbRow.zoom_user_id,
      email: dbRow.email,
      status: meetingRelayerConstants.statuses[dbRow.status],
      lastMeetingCreatedAt: dbRow.last_meeting_created_at,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return ['id', 'zoomUserId', 'status', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch meeting relayer objects for ids.
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
   * Flush cache
   *
   * @param {object} params
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = MeetingRelayerModel;

const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  zoomEventConstants = require(rootPrefix + '/lib/globalConstant/zoomEvent');

// Declare variables.
const dbName = databaseConstants.meetingDbName;

/**
 * Class for zoom events model.
 *
 * @class ZoomEventModel
 */
class ZoomEventModel extends ModelBase {
  /**
   * Constructor for zoom events model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'zoom_events';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      eventId: dbRow.event_id,
      status: zoomEventConstants.statuses[dbRow.status],
      eventData: dbRow.event_data,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch ost event for id.
   *
   * @param {number} id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ id: id })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Fetch ost event for id.
   *
   * @param {number} eventId
   *
   * @return {object}
   */
  async fetchByEventId(eventId) {
    const oThis = this;

    const dbRows = await oThis
      .select(['id'])
      .where({ event_id: eventId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }
}

module.exports = ZoomEventModel;

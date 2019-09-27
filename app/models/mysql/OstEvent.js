const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  ostEventConstants = require(rootPrefix + '/lib/globalConstant/ostEvent');

// Declare variables.
const dbName = databaseConstants.ostDbName;

/**
 * Class for ost events model.
 *
 * @class OstEventModel
 */
class OstEventModel extends ModelBase {
  /**
   * Constructor for ost events model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'ost_events';
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
      status: ostEventConstants.statuses[dbRow.status],
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

module.exports = OstEventModel;

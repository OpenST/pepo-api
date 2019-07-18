const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  database = require(rootPrefix + '/lib/globalConstant/database'),
  ostEventConstants = require(rootPrefix + '/lib/globalConstant/ostEvent');

const dbName = database.ostDbName;

class OstEventModel extends ModelBase {
  /**
   * ostEvent model
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'ost_events';
  }

  /**
   *
   * @param dbRow
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      eventId: dbRow.event_id,
      status: ostEventConstants.statuses[dbRow.status],
      eventData: dbRow.event_data,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /***
   * Fetch ost event for id
   *
   * @param id {Integer} - id
   *
   * @return {Object}
   */
  async fetchById(id) {
    const oThis = this;
    let dbRows = await oThis
      .select('*')
      .where({ id: id })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }
    return oThis.formatDbData(dbRows[0]);
  }

  /***
   * Fetch ost event for id
   *
   * @param id {Integer} - id
   *
   * @return {Object}
   */
  async fetchByEventId(eventId) {
    const oThis = this;
    let dbRows = await oThis
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

const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  activityConstants = require(rootPrefix + '/lib/globalConstant/activity');

const dbName = 'pepo_api_' + coreConstants.environment;

class ActivityModel extends ModelBase {
  /**
   * Constructor for Activity model.
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'activities';
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    return {
      id: dbRow.id,
      entityType: activityConstants.entityTypes[dbRow.entity_type],
      entityId: dbRow.entity_id,
      extraData: JSON.parse(dbRow.extra_data),
      status: activityConstants.statuses[dbRow.status],
      publishedTs: dbRow.published_ts,
      displayTs: dbRow.display_ts,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Fetch Activity by entityType and entityId
   *
   * @param {Integer} entityType
   * @param {Integer} entityId
   *
   * @return {object}
   */
  async fetchByEntityTypeAndEntityId(entityType, entityId) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ entity_type: entityType, entity_id: entityId })
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Fetch Activity by id.
   *
   * @param {number} id: id
   *
   * @return {object}
   */
  async fetchById(id) {
    const oThis = this;

    const dbRows = await oThis.fetchByIds([id]);

    return dbRows[id] || {};
  }

  /**
   * Fetch Activity for given ids.
   *
   * @param {array} ids: Activity Ids
   *
   * @return {Object}
   */
  async fetchByIds(ids) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where(['id IN (?)', ids])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = ActivityModel;

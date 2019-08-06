const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  activityConstants = require(rootPrefix + '/lib/globalConstant/activity');

// Declare variables.
const dbName = databaseConstants.feedDbName;

/**
 * Class for activity model.
 *
 * @class ActivityModel
 */
class ActivityModel extends ModelBase {
  /**
   * Constructor for activity model.
   *
   * @augments ModelBase
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
   * @param {number} dbRow.id
   * @param {number} dbRow.entity_type
   * @param {string} dbRow.extra_data
   * @param {number} dbRow.status
   * @param {number} dbRow.published_ts
   * @param {number} dbRow.display_ts
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
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

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List of formatted column names that can be exposed by service.
   *
   * @returns {array}
   */
  safeFormattedColumnNames() {
    return [
      'id',
      'entityType',
      'entityId',
      'extraData',
      'status',
      'publishedTs',
      'displayTs',
      'createdAt',
      'updatedAt'
    ];
  }

  /**
   * Fetch public and published activity ids.
   *
   * @param {object} params
   * @param {number/string} params.limit
   * @param {number/string} [params.paginationTimestamp]
   *
   *  @returns {Promise<object>}
   */
  async fetchPublicPublishedActivityIds(params) {
    const oThis = this;

    const activityIds = [];
    const activityMap = {};

    const paginationTimestamp = params.paginationTimestamp,
      limit = params.limit;

    const queryObject = oThis
      .select('*')
      .where(['status = ?', activityConstants.invertedStatuses[activityConstants.doneStatus]])
      .limit(limit)
      .order_by('published_ts desc');

    if (paginationTimestamp) {
      queryObject.where(['published_ts < ?', paginationTimestamp]);
    }

    const dbRows = await queryObject.fire();

    if (dbRows.length === 0) {
      return { activityIds: activityIds, activityMap: activityMap };
    }

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);

      activityIds.push(formatDbRow.id);
      activityMap[formatDbRow.id] = formatDbRow;
    }

    return { activityIds: activityIds, activityMap: activityMap };
  }

  /**
   * Fetch activity by entityType and entityId.
   *
   * @param {number} entityType
   * @param {number} entityId
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
   * Fetch activity by id.
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
   * @return {object}
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
  static async flushCache(params) {
    const ActivityByIds = require(rootPrefix + '/lib/cacheManagement/multi/ActivityByIds');

    await new ActivityByIds({ ids: [params.id] }).clear();
  }
}

module.exports = ActivityModel;

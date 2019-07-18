const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  database = require(rootPrefix + '/lib/globalConstant/database'),
  activityConstants = require(rootPrefix + '/lib/globalConstant/activity');

const dbName = database.feedDbName;

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
   * List Of Formatted Column names that can be exposed by service
   *
   *
   * @returns {Array}
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

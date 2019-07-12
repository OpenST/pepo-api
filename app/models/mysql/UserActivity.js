const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userActivityConstants = require(rootPrefix + '/lib/globalConstant/userActivity');

const dbName = 'pepo_api_' + coreConstants.environment;

class UserActivityModel extends ModelBase {
  /**
   * Constructor for User Activity model.
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'user_activities';
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
      userId: dbRow.user_id,
      activityId: dbRow.activity_id,
      publishedTs: dbRow.published_ts,
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
    return ['id', 'userId', 'activityId', 'publishedTs', 'createdAt', 'updatedAt'];
  }

  /**
   * Fetch activity ids for current user.
   *
   * @param {object} params
   * @param {array} params.userId
   * @param {number} params.limit
   * @param {number} [params.paginationTimestamp]
   *
   * @returns Promise<object>
   */
  async _currentUserActivityIds(params) {
    const oThis = this;

    const activityIds = [];
    const userActivityMap = {};

    const paginationTimestamp = params.paginationTimestamp,
      limit = params.limit;

    const queryObject = oThis
      .select('*')
      .where({ user_id: params.userId })
      .limit(limit)
      .order_by(
        'case when published_ts IS NULL then CURRENT_TIMESTAMP()\n' +
          '              else published_ts\n' +
          '         end desc'
      );

    if (paginationTimestamp) {
      queryObject.where(['published_ts < ?', paginationTimestamp]);
    }

    const dbRows = await queryObject.fire();

    if (dbRows.length === 0) {
      return { activityIds: activityIds, userActivityMap: userActivityMap };
    }

    for (let index = 0; index < dbRows.length; index++) {
      let formattedObj = oThis.formatDbData(dbRows[index]);
      activityIds.push(formattedObj.activityId);
      userActivityMap[formattedObj.activityId] = formattedObj;
    }

    return { activityIds: activityIds, userActivityMap: userActivityMap };
  }

  /**
   * Fetch activity ids for other user.
   *
   * @param {object} params
   * @param {array} params.userId
   * @param {number} params.limit
   * @param {number} [params.paginationTimestamp]
   *
   * @returns Promise<object>
   */
  async _otherUserActivityIds(params) {
    const oThis = this;

    const activityIds = [];
    const userActivityMap = {};

    const paginationTimestamp = params.paginationTimestamp,
      limit = params.limit;

    const queryObject = oThis
      .select('*')
      .where(['user_id = ? AND published_ts > 0', params.userId])
      .limit(limit)
      .order_by('published_ts desc');

    if (paginationTimestamp) {
      queryObject.where(['published_ts < ?', paginationTimestamp]);
    }

    const dbRows = await queryObject.fire();

    if (dbRows.length === 0) {
      return { activityIds: activityIds, userActivityMap: userActivityMap };
    }

    for (let index = 0; index < dbRows.length; index++) {
      let formattedObj = oThis.formatDbData(dbRows[index]);
      activityIds.push(formattedObj.activityId);
      userActivityMap[formattedObj.activityId] = formattedObj;
    }

    return { activityIds: activityIds, userActivityMap: userActivityMap };
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

module.exports = UserActivityModel;

const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

// Declare variables names.
const dbName = databaseConstants.feedDbName;

/**
 * Class for user activity model.
 *
 * @class UserActivityModel
 */
class UserActivityModel extends ModelBase {
  /**
   * Constructor for user activity model.
   *
   * @augments ModelBase
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
   * @param {number} dbRow.user_id
   * @param {number} dbRow.activity_id
   * @param {number} dbRow.published_ts
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      userId: dbRow.user_id,
      activityId: dbRow.activity_id,
      publishedTs: dbRow.published_ts,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * List Of formatted column names that can be exposed by service.
   *
   * @returns {array}
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
      const formattedObj = oThis.formatDbData(dbRows[index]);
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
      const formattedObj = oThis.formatDbData(dbRows[index]);
      activityIds.push(formattedObj.activityId);
      userActivityMap[formattedObj.activityId] = formattedObj;
    }

    return { activityIds: activityIds, userActivityMap: userActivityMap };
  }

  /**
   * Fetch user activity by user id, published timestamp and activity id.
   *
   * @param {number} userId
   * @param {number} publishedTs
   * @param {number} activityId
   *
   * @returns {Promise<*>}
   */
  async fetchUserActivityByUserIdPublishedTsAndActivityId(userId, publishedTs, activityId) {
    const oThis = this;

    let whereClause = [];

    if (publishedTs) {
      whereClause = ['published_ts = ?', publishedTs];
    } else {
      whereClause = ['published_ts IS NULL'];
    }

    const dbRows = await oThis
      .select('*')
      .where({
        user_id: userId,
        activity_id: activityId
      })
      .where(whereClause)
      .fire();

    if (dbRows.length === 0) {
      return {};
    }

    return oThis.formatDbData(dbRows[0]);
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.id
   * @param {number} params.userId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    const UserActivityByUserIdForOthersPagination = require(rootPrefix +
      '/lib/cacheManagement/single/UserActivityByUserIdForOthersPagination');
    promisesArray.push(new UserActivityByUserIdForOthersPagination({ userId: [params.userId] }).clear());

    const UserActivityByUserIdForSelfPagination = require(rootPrefix +
      '/lib/cacheManagement/single/UserActivityByUserIdForSelfPagination');
    promisesArray.push(new UserActivityByUserIdForSelfPagination({ userId: [params.userId] }).clear());

    await Promise.all(promisesArray);
  }
}

module.exports = UserActivityModel;

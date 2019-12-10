const rootPrefix = '../../..',
  CassandraModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  cassandraKeyspaceConstants = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  userVideoViewConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userVideoView');

// Declare variables.
const keyspace = cassandraKeyspaceConstants.cassandraKeyspaceName;

/**
 * Class for user video view model.
 *
 * @class UserVideoViewModel
 */
class UserVideoViewModel extends CassandraModelBase {
  /**
   * Constructor for user video view model.
   *
   * @augments CassandraModelBase
   *
   * @constructor
   */
  constructor() {
    super({ keyspace: keyspace });

    const oThis = this;

    oThis.tableName = 'user_video_views';
  }

  /**
   * Keys for table user_notification_visit_details.
   *
   * @returns {{partition: string[], sort: string[]}}
   */
  keyObject() {
    return {
      partition: [userVideoViewConstants.shortToLongNamesMap.user_id],
      sort: [userVideoViewConstants.shortToLongNamesMap.video_id]
    };
  }

  get longToShortNamesMap() {
    return userVideoViewConstants.longToShortNamesMap;
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.user_id
   * @param {number} dbRow.video_id
   * @param {number} dbRow.last_view_at
   * @param {number} dbRow.last_reply_view_at
   *
   * @returns {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    // Note:-last_visited_at is for activity_last_visited_by.

    /* eslint-disable */
    const formattedData = {
      userId: dbRow.user_id ? Number(dbRow.user_id) : undefined,
      videoId: dbRow.video_id ? Number(dbRow.video_id) : undefined,
      lastViewAt: dbRow.last_view_at ? basicHelper.dateToMilliSecondsTimestamp(dbRow.last_view_at) : undefined,
      lastReplyViewAt: dbRow.last_reply_view_at
        ? basicHelper.dateToMilliSecondsTimestamp(dbRow.last_reply_view_at)
        : undefined
    };
    /* eslint-enable */

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Update user video view time.
   *
   * @param {object} queryParams
   * @param {number} queryParams.userId
   * @param {number} queryParams.parentVideoIds
   * @param {number} queryParams.lastReplyViewAt
   *
   * @returns {Promise<any>}
   */
  async updateLastReplyViewAtForParentVideos(queryParams) {
    const oThis = this;

    const query = 'update ' + oThis.queryTableName + ' set last_reply_view_at = ? where user_id = ? and video_id = ?;';
    const queries = [];

    for (let index = 0; index < queryParams.parentVideoIds.length; index++) {
      const updateParam = [queryParams.lastReplyViewAt, queryParams.userId, queryParams.parentVideoIds[index]];
      queries.push({ query: query, params: updateParam });
    }

    return oThis.batchFire(queries);
  }

  /**
   * Update user video view time.
   *
   * @param {object} queryParams
   * @param {number} queryParams.userId
   * @param {number} queryParams.videoIds
   * @param {number} queryParams.lastViewAt
   *
   * @returns {Promise<any>}
   */
  async updateLastViewAtForVideos(queryParams) {
    const oThis = this;

    const query = 'update ' + oThis.queryTableName + ' set last_view_at = ? where user_id = ? and video_id = ?;';
    const queries = [];

    for (let index = 0; index < queryParams.videoIds.length; index++) {
      const updateParam = [queryParams.lastViewAt, queryParams.userId, queryParams.videoIds[index]];
      queries.push({ query: query, params: updateParam });
    }

    return oThis.batchFire(queries);
  }

  /**
   * Fetch rows for a user and video ids
   *
   * @param {object} queryParams
   * @param {number} queryParams.userId
   * @param {number} queryParams.videoIds
   *
   * @returns {*}
   */
  async fetchVideoViewDetails(queryParams) {
    const oThis = this;
    const response = {};

    const query = `select last_view_at, last_reply_view_at, video_id from ${
      oThis.queryTableName
    } where user_id = ? and video_id in ?;`;
    const params = [queryParams.userId, queryParams.videoIds];

    const queryRsp = await oThis.fire(query, params);

    for (let index = 0; index < queryRsp.rows.length; index++) {
      const formattedData = oThis.formatDbData(queryRsp.rows[index]);
      response[formattedData.videoId] = formattedData;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache() {
    // Do nothing.
  }
}

module.exports = UserVideoViewModel;

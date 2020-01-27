const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

// Declare variables names.
const dbName = databaseConstants.channelDbName;

/**
 * Class for channel users model.
 *
 * @class ChannelUserModel
 */
class ChannelUserModel extends ModelBase {
  /**
   * Constructor for channels model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'channel_users';
  }

  /**
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.channel_id
   * @param {number} dbRow.user_id
   * @param {number} dbRow.role
   * @param {number} dbRow.status
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @returns {{}}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      channelId: dbRow.channel_id,
      userId: dbRow.user_id,
      role: channelUsersConstants.roles[dbRow.role],
      status: channelUsersConstants.statuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch by channel id.
   *
   * @param {integer} params.limit: no of rows to fetch
   * @param {integer} params.channelId: channel id
   * @param {integer} params.paginationTimestamp: pagination timestamp
   *
   * @returns {Promise}
   */
  async fetchByChannelId(params) {
    const oThis = this;

    const limit = params.limit,
      channelId = params.channelId,
      paginationTimestamp = params.paginationTimestamp;

    const queryObject = oThis
      .select('user_id, created_at')
      .where({
        channel_id: channelId,
        status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus] // TODO:channels - No index on status.
      })
      .order_by('created_at desc')
      .limit(limit);

    if (paginationTimestamp) {
      queryObject.where(['created_at < ?', paginationTimestamp]);
    }

    const dbRows = await queryObject.fire();

    let nextPaginationTimestamp = null;

    const userIds = [];

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      nextPaginationTimestamp = formatDbRow.createdAt;
      userIds.push(formatDbRow.userId);
    }

    return { userIds: userIds, nextPaginationTimestamp: nextPaginationTimestamp };
  }

  /**
   * Fetch channel user for given user id and channel ids.
   *
   * @param {number} userId: user id.
   * @param {array<number>} channelIds: channel ids
   *
   * @returns {Promise<object>}
   */
  async fetchByUserIdAndChannelIds(userId, channelIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ user_id: userId, channel_id: channelIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.channelId] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} [params.channelId]
   * @param {number} [params.userId]
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const promisesArray = [];

    if (params.channelId) {
      const ChannelUsersByChannelIdPaginationCache = require(rootPrefix +
        '/lib/cacheManagement/single/UserIdsByChannelIdPagination.js');
      promisesArray.push(new ChannelUsersByChannelIdPaginationCache({ channelId: params.channelId }).clear());
    }

    if (params.userId && params.channelId) {
      const ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
        '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds');
      promisesArray.push(
        new ChannelUserByUserIdAndChannelIdsCache({ userId: params.userId, channelIds: [params.channelId] }).clear()
      );
    }

    await Promise.all(promisesArray);
  }
}

module.exports = ChannelUserModel;

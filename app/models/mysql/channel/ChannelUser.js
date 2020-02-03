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
   * @param {number} dbRow.notification_status
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
      notificationStatus: channelUsersConstants.notificationStatuses[dbRow.notification_status],
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
   * @param {integer} params.page: page
   *
   * @returns {Promise}
   */
  async fetchByChannelId(params) {
    const oThis = this;

    const channelId = params.channelId,
      page = params.page,
      limit = params.limit,
      offset = (page - 1) * limit;

    const queryObject = oThis
      .select('*')
      .where({
        channel_id: channelId,
        status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus] // TODO:channels - No index on status.
      })
      .order_by('role asc, created_at desc')
      .limit(limit)
      .offset(offset);

    const dbRows = await queryObject.fire();

    const userIds = [],
      channelUserDetails = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      channelUserDetails[formatDbRow.userId] = formatDbRow;
      userIds.push(formatDbRow.userId);
    }

    return {
      userIds: userIds,
      channelUserDetails: channelUserDetails
    };
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
   * Fetch channel user for given user id and channel ids.
   *
   * @param {number} userIds: user id.
   * @param {array<number>} channelIds: channel ids
   *
   * @returns {Promise<object>}
   */
  async fetchUserIdsForChannelIds(userIds, channelIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({ user_id: userIds, channel_id: channelIds })
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.channelId] = response[formatDbRow.channelId] || [];
      response[formatDbRow.channelId].push(formatDbRow.userId);
    }

    return response;
  }

  /**
   * Fetch by user id and status.
   *
   * @param userId
   * @param status
   * @returns {Promise<void>}
   */
  async fetchByUserIdAndStatus(userId, status) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where(['status = ? AND user_id = ?', status, userId])
      .fire();

    const response = {};

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.channelId] = formatDbRow;
    }

    return response;
  }

  /**
   * Fetch users with active status and notification status on.
   *
   * @param channelIds
   * @returns {Promise<{allUserIds: *, channelIdToUserIdsMap: *}>}
   */
  async fetchActiveUserIdsWithNotificationStatusOn(channelIds) {
    const oThis = this;

    const dbRows = await oThis
      .select('*')
      .where({
        channel_id: channelIds,
        notification_status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeNotificationStatus],
        status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus]
      })
      .fire();

    const channelIdToUserIdsMap = {},
      allUserIds = [];

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      channelIdToUserIdsMap[formatDbRow.channelId] = channelIdToUserIdsMap[formatDbRow.channelId] || [];
      channelIdToUserIdsMap[formatDbRow.channelId].push(formatDbRow.userId);
      allUserIds.push(formatDbRow.userId);
    }

    return {
      channelIdToUserIdsMap: channelIdToUserIdsMap,
      allUserIds: allUserIds
    };
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
        '/lib/cacheManagement/single/ChannelUsersByChannelIdPagination');
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

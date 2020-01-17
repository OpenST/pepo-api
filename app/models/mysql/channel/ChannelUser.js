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
      status: channelUsersConstants.invertedStatuses[dbRow.status],
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Fetch channel user for given user id and channel ids.
   *
   * @param {array} ids: channel ids
   *
   * @return {object}
   */
  async fetchByUserIdAndChannelIds(userId, channelIds) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where({ user_id: userId, channel_id: channelIds })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis._formatDbData(dbRows[index]);
      response[formatDbRow.channelId] = formatDbRow;
    }

    return response;
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {
    const cacheByUserIdAndChannelIds = require(rootPrefix +
      '/lib/cacheManagement/multi/ChannelUserByUserIdAndChannelIds');

    if (params.userId && params.channelId) {
      await new cacheByUserIdAndChannelIds({ userId: params.userId, channelIds: [params.channelId] }).clear();
    }
  }
}

module.exports = ChannelUserModel;

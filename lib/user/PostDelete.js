const rootPrefix = '../..',
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Post user deletion.
 *
 * @class PostDeleteJob
 */
class PostDeleteJob {
  /**
   * Constructor for base class of video deletion.
   *
   * @param {object} params
   * @param {boolean} [params.isUserAction]: isUserAction
   * @param {number} params.userId: User Id
   * @param {number} params.currentAdminId: currentAdminId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.currentAdminId = params.currentAdminId;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    const promisesArray = [];

    promisesArray.push(oThis._deleteUserFromChannels());

    await Promise.all(promisesArray);

    return responseHelper.successWithData({});
  }

  /**
   * Delete given users from channels.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteUserFromChannels() {
    const oThis = this;

    let limit = 50,
      offset = 0;

    while (true) {
      const dbRows = await new ChannelUserModel()
        .select(['channel_id', 'id'])
        .where({
          user_id: oThis.userId,
          status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus]
        })
        .order_by('id asc')
        .limit(limit)
        .offset(offset)
        .fire();

      if (dbRows.length === 0) {
        return;
      }

      const channelIds = [],
        channelUserIds = [];

      for (let i = 0; i < dbRows.length; i++) {
        const dbRow = dbRows[i];
        channelIds.push(dbRow.channel_id);
        channelUserIds.push(dbRow.id);
      }

      await new ChannelUserModel()
        .update({ status: channelUsersConstants.invertedStatuses[channelUsersConstants.inactiveStatus] })
        .where({ id: channelUserIds })
        .fire();

      await new ChannelUserByUserIdAndChannelIdsCache({ userId: oThis.userId, channelIds: channelIds }).clear();

      await new ChannelStatModel()
        .update('total_users = total_users - 1')
        .where({ channel_id: channelIds })
        .fire();

      await ChannelStatModel.flushCache({ channelIds: channelIds });

      offset = offset + limit;
    }
  }
}

module.exports = PostDeleteJob;

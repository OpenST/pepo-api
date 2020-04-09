const program = require('commander');

const rootPrefix = '../..',
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ChannelStatModel = require(rootPrefix + '/app/models/mysql/channel/ChannelStat'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program
  .option('--userId <userId>', 'User id')
  .option('--channelId <channelId>', 'Channel id')
  .option('--role <role>', 'valid values - ADMIN/NORMAL')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(
    '    node executables/oneTimers/2020_01_30_changeChannelUserRole.js --userId 1234 --channelId 1 --role "ADMIN"'
  );
  logger.log('');
  logger.log('');
});

if (!program.userId || !program.channelId || !program.role) {
  program.help();
  process.exit(1);
}

class ChangeChannelUserRole {
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.channelId = params.channelId;
    oThis.role = params.role;

    oThis.channelUser = false;
  }

  async perform() {
    const oThis = this;

    await oThis._validate();

    await oThis._checkIfChannelUser();

    await oThis._changeRole();
  }

  /**
   * Validate input
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validate() {
    const oThis = this;

    // Validate channel id
    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelObj = cacheResponse.data[oThis.channelId];

    if (!CommonValidator.validateNonEmptyObject(channelObj) || channelObj.status !== channelConstants.activeStatus) {
      return Promise.reject(new Error('===== Invalid channel id ======='));
    }

    const response = await new UserModel().fetchById(oThis.userId);

    if (!CommonValidator.validateNonEmptyObject(response) || response.status != userConstants.activeStatus) {
      return Promise.reject(new Error('=== Not a valid user ==='));
    }

    // Check for valid role
    if (!channelUsersConstants.invertedRoles[oThis.role]) {
      return Promise.reject(new Error('===== Invalid role ====='));
    }
  }

  /**
   * Check if channel user
   * @returns {Promise<void>}
   * @private
   */
  async _checkIfChannelUser() {
    const oThis = this;

    const cacheRsp = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: oThis.userId,
      channelIds: [oThis.channelId]
    }).fetch();

    if (CommonValidator.validateNonEmptyObject(cacheRsp.data[oThis.channelId])) {
      oThis.channelUser = true;
    }
  }

  /**
   * Change role
   * @returns {Promise<void>}
   * @private
   */
  async _changeRole() {
    const oThis = this;

    let queryParams;
    if (oThis.channelUser) {
      queryParams = {
        role: channelUsersConstants.invertedRoles[oThis.role]
      };
      await new ChannelUserModel()
        .update(queryParams)
        .where({
          user_id: oThis.userId,
          channel_id: oThis.channelId
        })
        .fire();
    } else {
      queryParams = {
        user_id: oThis.userId,
        channel_id: oThis.channelId,
        notification_status:
          channelUsersConstants.invertedNotificationStatuses[channelUsersConstants.activeNotificationStatus],
        status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus],
        role: channelUsersConstants.invertedRoles[oThis.role]
      };
      await new ChannelUserModel().insert(queryParams).fire();

      await oThis._updateChannelStats();
    }

    queryParams = {
      ...queryParams,
      user_id: oThis.userId,
      channel_id: oThis.channelId
    };

    const formatDbData = new ChannelUserModel().formatDbData(queryParams);
    await ChannelUserModel.flushCache(formatDbData);
  }

  /**
   * Update channel stats
   * @returns {Promise}
   * @private
   */
  async _updateChannelStats() {
    const oThis = this;

    await new ChannelStatModel()
      .update('total_users = total_users + 1')
      .where({ channel_id: oThis.channelId })
      .fire();

    await ChannelStatModel.flushCache({ channelIds: [oThis.channelId] });
  }
}

new ChangeChannelUserRole({
  userId: program.userId,
  channelId: program.channelId,
  role: program.role
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(err);
    process.exit(1);
  });

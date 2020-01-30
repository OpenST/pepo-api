const program = require('commander');

const rootPrefix = '../..',
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program
  .option('--userId <userId>', 'User id')
  .option('--channelId <channelId>', 'Channel id')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/2020_01_30_makeChannelUserAdmin.js --userId 1234 --channelId 1');
  logger.log('');
  logger.log('');
});

if (!program.userId || !program.channelId) {
  program.help();
  process.exit(1);
}

class MakeChannelUserAdmin {
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.channelId = params.channelId;

    oThis.channelUser = false;
  }

  async perform() {
    const oThis = this;

    const valid = await oThis._checkValidUser();

    if (!valid) {
      return;
    }

    await oThis._checkIfChannelUser();

    await oThis._upgradeRole();
  }

  /**
   * Check valid user
   * @returns {Promise}
   * @private
   */
  async _checkValidUser() {
    const oThis = this;

    const response = await new UserModel().fetchById(oThis.userId);

    if (!CommonValidator.validateNonEmptyObject(response) || response.status != userConstants.activeStatus) {
      console.error('=== Not a valid user ===');

      return false;
    }

    return true;
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
   * Upgrade role
   * @returns {Promise<void>}
   * @private
   */
  async _upgradeRole() {
    const oThis = this;

    if (oThis.channelUser) {
      await new ChannelUserModel()
        .update({
          role: channelUsersConstants.invertedRoles[channelUsersConstants.adminRole]
        })
        .where({
          user_id: oThis.userId,
          channel_id: oThis.channelId
        })
        .fire();
    } else {
      await new ChannelUserModel()
        .insert({
          user_id: oThis.userId,
          channel_id: oThis.channelId,
          notification_status:
            channelUsersConstants.invertedNotificationStatuses[channelUsersConstants.activeNotificationStatus],
          status: channelUsersConstants.invertedStatuses[channelUsersConstants.activeStatus],
          role: channelUsersConstants.invertedRoles[channelUsersConstants.adminRole]
        })
        .fire();
    }

    await ChannelUserModel.flushCache({ userId: oThis.userId, channelId: oThis.channelId });
  }
}

new MakeChannelUserAdmin({
  userId: program.userId,
  channelId: program.channelId
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });

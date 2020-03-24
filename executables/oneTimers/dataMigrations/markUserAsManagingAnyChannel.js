/**
 * One timer to unmark creator approval.
 *
 * Usage: node executables/oneTimers/dataMigrations/markAsUserAsManagingAnyChannel.js
 *
 * @module executables/oneTimers/dataMigrations/markAsUserAsManagingAnyChannel
 */
const command = require('commander');

const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

command
  .version('0.1.0')
  .usage('[options]')
  .parse(process.argv);

class markUserAsManagingAnyChannel {
  constructor() {
    const oThis = this;
  }

  async perform() {
    const oThis = this,
      userIds = [];

    const uniqChannelAdminUser = await new ChannelUserModel()
      .select('DISTINCT(user_id)')
      .where({ role: channelUsersConstants.invertedRoles[channelUsersConstants.adminRole] })
      .fire();

    for (let i = 0; i < uniqChannelAdminUser.length; i++) {
      userIds.push(uniqChannelAdminUser[i].user_id);
    }

    console.log('--------userIds-------------', JSON.stringify(userIds));
    await new UserModel().markUserChannelAdmin(userIds).then(console.log);
  }
}

new markUserAsManagingAnyChannel()
  .perform()
  .then(function(r) {
    logger.win('SUCCESSFULLY DONE');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error: ', err);
    process.exit(1);
  });

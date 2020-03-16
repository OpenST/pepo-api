/**
 * One timer to unmark creator approval.
 *
 * Usage: node executables/oneTimers/dataMigrations/markAsUserUnapproved.js
 *
 * @module executables/oneTimers/dataMigrations/markAsUserUnapproved
 */
const command = require('commander');

const rootPrefix = '../../..',
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  UserMuteModel = require(rootPrefix + '/app/models/mysql/UserMute'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

command
  .version('0.1.0')
  .usage('[options]')
  .parse(process.argv);

class MarkAsUserUnapproved {
  constructor() {
    const oThis = this;
    oThis.userWithContent = {};
    oThis.userIdsToMarkAsUnapproved = [];
  }

  async perform() {
    const oThis = this;

    await oThis._fetchUsers();

    logger.log('MutedUsersWithContent=============', oThis.userWithContent);
    logger.log('userIdsToMarkAsUnapproved=============', oThis.userIdsToMarkAsUnapproved);
    //  todo: mark userIdsToMarkAsUnapproved as unmuted and unapproved.
  }

  /**
   * Fetch users
   *
   * @param limit
   * @param offset
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    let limit = 25,
      offset = 0;

    while (true) {
      logger.log('Fetching Globally Muted User');

      let userIds = [];
      let approvedMutedUserIds = [];

      const data = await new UserMuteModel()
        .select('id, user2_id')
        .where({ user1_id: 0 })
        .limit(limit)
        .offset(offset)
        .order_by('id asc')
        .fire();

      for (let index = 0; index < data.length; index++) {
        const dbRow = data[index];
        userIds.push(dbRow.user2_id);
      }

      if (userIds.length == 0) {
        return;
      }

      logger.log('Fetching approved & Globally Muted User');

      let usersData = await new UserModel()
        .select('id')
        .where({ id: userIds, status: userConstants.invertedStatuses[userConstants.activeStatus] })
        .where('properties & 4 =4')
        .fire();

      for (let index = 0; index < usersData.length; index++) {
        const dbRow = usersData[index];
        approvedMutedUserIds.push(dbRow.id);
      }

      logger.log('approvedMutedUserIds count:', approvedMutedUserIds.length);

      if (approvedMutedUserIds.length > 0) {
        await oThis.markAsUnapprovedIfNoContent(approvedMutedUserIds);
      }

      offset = offset + limit;
    }
  }

  async markAsUnapprovedIfNoContent(userIds) {
    const oThis = this;

    logger.log('markAsUnapprovedIfNoContent=============');

    let queryObject1 = await new ReplyDetailModel()
      .select('id, creator_user_id')
      .where({
        creator_user_id: userIds,
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.activeStatus]
      })
      .fire();

    for (let index = 0; index < queryObject1.length; index++) {
      const dbRow = queryObject1[index];
      oThis.userWithContent[dbRow.creator_user_id] = 1;
    }

    let queryObject2 = await new VideoDetailModel()
      .select('id, creator_user_id')
      .where({
        creator_user_id: userIds,
        status: videoDetailsConstants.invertedStatuses[videoDetailsConstants.activeStatus]
      })
      .fire();

    for (let index = 0; index < queryObject2.length; index++) {
      const dbRow = queryObject2[index];
      oThis.userWithContent[dbRow.creator_user_id] = 1;
    }

    for (let index = 0; index < userIds.length; index++) {
      const userId = userIds[index];
      if (!oThis.userWithContent[userId]) {
        oThis.userIdsToMarkAsUnapproved.push(userId);
      }
    }
  }
}

new MarkAsUserUnapproved()
  .perform()
  .then(function(r) {
    logger.win('SUCCESSFULLY DONE');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error: ', err);
    process.exit(1);
  });

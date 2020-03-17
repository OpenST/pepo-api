/**
 * One timer to unmark creator approval.
 *
 * Usage: node executables/oneTimers/dataMigrations/markAsUserUnapproved.js
 *
 * @module executables/oneTimers/dataMigrations/markAsUserUnapproved
 */
const command = require('commander');

const rootPrefix = '../../..',
  DeleteReplyVideoLib = require(rootPrefix + '/lib/video/delete/ReplyVideos'),
  DeleteUserVideosLib = require(rootPrefix + '/lib/video/delete/UserVideos'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  UserMuteModel = require(rootPrefix + '/app/models/mysql/UserMute'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/admin/AdminActivityLog'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/admin/adminActivityLogs'),
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
    oThis.replyDetailIds = [];
    oThis.videoIds = [];
  }

  async perform() {
    const oThis = this;

    await oThis._fetchUsers();

    await oThis._unapproveUsers();

    // await oThis._deleteContentForApprovedUsers();

    // await oThis._deleteReplyForUnapprovedUsers();
  }

  /**
   * Delete content from users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteReplyForUnapprovedUsers() {
    const oThis = this;

    logger.log('Fetching unapproved User');

    let unapprovedUserIds = [];

    let usersData = await new UserModel()
      .select('id')
      .where({ status: userConstants.invertedStatuses[userConstants.activeStatus] })
      .where('properties & 4 !=4')
      .fire();

    for (let index = 0; index < usersData.length; index++) {
      const dbRow = usersData[index];
      unapprovedUserIds.push(dbRow.id);
    }

    logger.log('unapprovedUserIds count:', unapprovedUserIds.length);

    if (unapprovedUserIds.length == 0) {
      return;
    }

    const replyDetailMapByUserId = {};

    let queryObject1 = await new ReplyDetailModel()
      .select(['id', 'creator_user_id'])
      .where({
        creator_user_id: unapprovedUserIds,
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.activeStatus]
      })
      .fire();

    for (let index = 0; index < queryObject1.length; index++) {
      const dbRow = queryObject1[index];
      replyDetailMapByUserId[dbRow.creator_user_id] = replyDetailMapByUserId[dbRow.creator_user_id] || [];
      replyDetailMapByUserId[dbRow.creator_user_id].push(dbRow.id);
    }

    logger.log('replyDetailMapByUserId:', replyDetailMapByUserId);

    for (let userId in replyDetailMapByUserId) {
      const replyDetailIds = replyDetailMapByUserId[userId];
      logger.log(`\n\n replyDetailIds BATCH to DELETE For Unapproved Users=${userId}============`, replyDetailIds);

      await new DeleteReplyVideoLib({
        replyDetailsIds: replyDetailIds,
        isUserAction: false,
        currentAdminId: 0,
        userId: userId
      }).perform();
    }
  }

  /**
   * Delete content from users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteContentForApprovedUsers() {
    const oThis = this;

    logger.log('\n\nMutedUsersWithContent=============', oThis.userWithContent);

    for (let userId in oThis.userWithContent) {
      const replyDetailIds = oThis.userWithContent[userId].replyDetailIds;
      const videoIds = oThis.userWithContent[userId].videoIds;

      if (replyDetailIds.length > 0) {
        logger.log('\n\n replyDetailIds BATCH to DELETE=============', replyDetailIds);
        await new DeleteReplyVideoLib({
          replyDetailsIds: replyDetailIds,
          isUserAction: false,
          currentAdminId: 0,
          userId: userId
        }).perform();
      }

      if (videoIds.length > 0) {
        logger.log('\n\n videoIds BATCH to DELETE=============', videoIds);
        await new DeleteUserVideosLib({
          userId: userId,
          currentAdminId: 0,
          videoIds: videoIds,
          isUserCreator: true
        }).perform();
      }
    }
  }

  /**
   * Unapprove users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _unapproveUsers() {
    const oThis = this;

    logger.log('\n\nuserIdsToMarkAsUnapproved=============', oThis.userIdsToMarkAsUnapproved);

    const batchSize = 25;

    for (let i = 0; i < oThis.userIdsToMarkAsUnapproved.length; i = i + batchSize) {
      const batchUserIds = oThis.userIdsToMarkAsUnapproved.slice(i, i + batchSize);

      logger.log('BATCH USER IDS TO UNAPPROVE=============', batchUserIds);

      await new UserModel()
        .update('properties = properties ^ 4')
        .where({
          id: batchUserIds,
          status: userConstants.invertedStatuses[userConstants.activeStatus]
        })
        .where('properties & 4 =4')
        .fire();

      await new InviteCodeModel()
        .update({
          invite_limit: inviteCodeConstants.inviteMaxLimit
        })
        .where({ user_id: batchUserIds })
        .fire();

      const promises = [];

      for (let index = 0; index < batchUserIds.length; index++) {
        const userId = batchUserIds[index];
        const promise = new AdminActivityLogModel().insertAction({
          adminId: 0,
          actionOn: userId,
          action: adminActivityLogConstants.unapprovedAsCreator
        });
        promises.push(promise);
      }

      await Promise.all(promises);
    }
  }

  /**
   * Fetch users
   *
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
      oThis.userWithContent[dbRow.creator_user_id] = oThis.userWithContent[dbRow.creator_user_id] || {
        replyDetailIds: [],
        videoIds: []
      };
      oThis.userWithContent[dbRow.creator_user_id]['replyDetailIds'].push(dbRow.id);
      oThis.replyDetailIds.push(dbRow.id);
    }

    let queryObject2 = await new VideoDetailModel()
      .select('id, creator_user_id, video_id')
      .where({
        creator_user_id: userIds,
        status: videoDetailsConstants.invertedStatuses[videoDetailsConstants.activeStatus]
      })
      .fire();

    for (let index = 0; index < queryObject2.length; index++) {
      const dbRow = queryObject2[index];
      oThis.userWithContent[dbRow.creator_user_id] = oThis.userWithContent[dbRow.creator_user_id] || {
        replyDetailIds: [],
        videoIds: []
      };
      oThis.userWithContent[dbRow.creator_user_id]['videoIds'].push(dbRow.video_id);
      oThis.videoIds.push(dbRow.video_id);
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

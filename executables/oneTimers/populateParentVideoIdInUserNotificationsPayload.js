/*
 * Script to populate parent video id in user notifications payload.
 *
 * Usage - node executables/oneTimers/populateParentVideoIdInUserNotificationsPayload.js
 */

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  commonValidators = require(rootPrefix + '/lib/validators/Common'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const limit = 30,
  BATCH_SIZE = 30;

class PopulateParentVideoIdInUserNotificationsPayload {
  constructor() {
    const oThis = this;

    oThis.userIds = [];
    oThis.replyDetailsIdToParentIdMap = {};
  }

  /**
   * Perform
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchUserIds();

    await oThis._populate();
  }

  /**
   * Fetch user ids
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserIds() {
    const oThis = this;

    let minUserId = -1;

    while (true) {
      const rows = await new UserModel()
        .select('id')
        .where({ status: userConstants.invertedStatuses[userConstants.activeStatus] })
        .where(['id > ?', minUserId])
        .limit(limit)
        .order_by('id asc')
        .fire();

      if (rows.length == 0) {
        break;
      } else {
        const batchedUserIds = [];
        for (let ind = 0; ind < rows.length; ind++) {
          oThis.userIds.push(rows[ind].id);
          batchedUserIds.push(rows[ind].id);
          minUserId = rows[ind].id;
        }
        await oThis._fetchParentIdForReplyCreators(batchedUserIds);
      }
    }
  }

  /**
   * Fetch parent id for reply creators.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchParentIdForReplyCreators(userIds) {
    const oThis = this;

    const dbRows = await new ReplyDetailsModel()
      .select('*')
      .where({
        status: replyDetailConstants.invertedStatuses[replyDetailConstants.activeStatus],
        creator_user_id: userIds
      })
      .fire();

    if (dbRows.length === 0) {
      return;
    }

    for (let ind = 0; ind < dbRows.length; ind++) {
      let dbRow = dbRows[ind];

      oThis.replyDetailsIdToParentIdMap[dbRow.id] = dbRow.parent_id;
    }
  }

  /**
   * Populate
   *
   * @returns {Promise<void>}
   * @private
   */
  async _populate() {
    const oThis = this;

    const kindsArray = [
      userNotificationConstants.replySenderWithAmountKind,
      userNotificationConstants.replySenderWithoutAmountKind,
      userNotificationConstants.replyReceiverWithAmountKind,
      userNotificationConstants.replyReceiverWithoutAmountKind,
      userNotificationConstants.replyUserMentionKind
    ];

    while (oThis.userIds.length > 0) {
      const queries = [],
        cacheFlushPromises = [],
        userNotificationModelObj = new UserNotificationModel();

      const batchedUserIds = oThis.userIds.splice(0, BATCH_SIZE);

      console.log('current user ids batch:', batchedUserIds);

      const userIdToUserNotificationsMap = await oThis._fetchUserNotificationByUserIds({
        userIds: batchedUserIds
      });

      if (!userIdToUserNotificationsMap || !commonValidators.validateNonEmptyObject(userIdToUserNotificationsMap)) {
        continue;
      }

      for (let ind = 0; ind < batchedUserIds.length; ind++) {
        let userId = batchedUserIds[ind],
          userNotifications = userIdToUserNotificationsMap[userId];

        // console.log('userNotifications---', userNotifications);

        if (userNotifications) {
          const query = `UPDATE ${
            userNotificationModelObj.queryTableName
          } SET payload = ? WHERE user_id = ? AND last_action_timestamp = ? AND uuid = ?`;

          for (let newInd = 0; newInd < userNotifications.length; newInd++) {
            let userNotification = userNotifications[newInd],
              payload = userNotification.payload,
              replyDetailId = payload.replyDetailId;

            if (kindsArray.indexOf(userNotification.kind) > -1) {
              if (!oThis.replyDetailsIdToParentIdMap[replyDetailId]) {
                // continue with to next userNotifications
                console.log('Data not found for replyDetailId----> ', replyDetailId);
              } else {
                payload['pvid'] = oThis.replyDetailsIdToParentIdMap[replyDetailId];

                const stringifiedPayload = JSON.stringify(payload),
                  updateParam = [
                    stringifiedPayload,
                    userId,
                    userNotification.lastActionTimestamp,
                    userNotification.uuid
                  ];

                queries.push({ query: query, params: updateParam });
                cacheFlushPromises.push(UserNotificationModel.flushCache({ userId: userId }));
              }
            }
          }
        }
      }
      if (queries.length > 0) {
        console.log('========batchFire(queries)=====\n', queries);
        await userNotificationModelObj.batchFire(queries);
        await Promise.all(cacheFlushPromises);
      }
    }
  }

  /**
   * Fetch user notifications.
   *
   * @param params
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserNotificationByUserIds(params) {
    const oThis = this;

    const response = {},
      userNotificationModelObj = new UserNotificationModel();

    const queryString = `select * from ${userNotificationModelObj.queryTableName} where user_id IN ? ALLOW FILTERING`;

    const queryRsp = await userNotificationModelObj.fire(queryString, [params.userIds]);

    if (queryRsp.rows.length === 0) {
      return response; // returns {}
    }

    for (let index = 0; index < queryRsp.rows.length; index++) {
      const formattedData = userNotificationModelObj.formatDbData(queryRsp.rows[index]);
      response[formattedData.userId] = response[formattedData.userId] || [];
      response[formattedData.userId].push(formattedData);
    }

    return response;
  }
}

new PopulateParentVideoIdInUserNotificationsPayload()
  .perform()
  .then(function() {
    logger.win('========== BACK POPULATION SUCCESSFULLY DONE!! ==============');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(err);
    process.exit(0);
  });

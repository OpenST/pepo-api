/*
 * Script to populate parent video id in user notifications payload.
 *
 * Usage - node executables/oneTimers/populateParentVideoIdInUserNotificationsPayload.js
 */
const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  commonValidators = require(rootPrefix + '/lib/validators/Common'),
  cacheProvider = require(rootPrefix + '/lib/providers/memcached'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const limit = 30,
  BATCH_SIZE = 30,
  selectQueryLimit = 30;

class PopulateParentVideoIdInUserNotificationsPayload {
  constructor() {
    const oThis = this;

    oThis.userIds = [];
    oThis.replyDetailsIdToParentIdMap = {};

    oThis.pageState = null;
  }

  /**
   * Perform
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchUserIds();

    await oThis._populate();

    await oThis._flushCache();
  }

  /**
   * Fetch user ids
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserIds() {
    const oThis = this;

    let iterationLastId = -1;

    while (true) {
      const rows = await new UserModel()
        .select('id')
        .where(['id > ?', iterationLastId])
        .where(['id = 2221'])
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
          iterationLastId = rows[ind].id;
        }

        await oThis._fetchParentIdForReplyCreators(batchedUserIds);
      }
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

    const kindsMap = {
      [userNotificationConstants.replySenderWithAmountKind]: 1,
      [userNotificationConstants.replySenderWithoutAmountKind]: 1,
      [userNotificationConstants.replyReceiverWithAmountKind]: 1,
      [userNotificationConstants.replyReceiverWithoutAmountKind]: 1,
      [userNotificationConstants.replyUserMentionKind]: 1
    };

    while (oThis.userIds.length > 0) {
      const queries = [];

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
            new UserNotificationModel().queryTableName
          } SET payload = ? WHERE user_id = ? AND last_action_timestamp = ? AND uuid = ?`;

          for (let newInd = 0; newInd < userNotifications.length; newInd++) {
            let userNotification = userNotifications[newInd],
              payload = userNotification.payload,
              replyDetailId = payload.rdid || payload.replyDetailId;

            if (kindsMap[userNotification.kind]) {
              if (!oThis.replyDetailsIdToParentIdMap[+replyDetailId]) {
                // continue with to next userNotifications
                console.log('Data not found for replyDetailId----> Need to investigate: ', replyDetailId);
              } else if (payload.hasOwnProperty('pvid')) {
                console.log('Parent video id already present in payload: ', replyDetailId, payload['pvid']);
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
              }
            }
          }
        }
      }
      if (queries.length > 0) {
        console.log('========batchFire(queries)=====\n', queries);

        while (true) {
          let batchedQueries = queries.splice(0, BATCH_SIZE);

          if (batchedQueries.length == 0) {
            break;
          }

          await new UserNotificationModel().batchFire(batchedQueries);
        }
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
        creator_user_id: userIds
      })
      .fire();

    if (dbRows.length === 0) {
      return;
    }

    for (let ind = 0; ind < dbRows.length; ind++) {
      let dbRow = dbRows[ind];

      oThis.replyDetailsIdToParentIdMap[+dbRow.id] = +dbRow.parent_id;
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

    let i = 0,
      response = {},
      pageState = null;

    const queryString = `select * from ${new UserNotificationModel().queryTableName} where user_id IN ?`;

    while (true) {
      i++;
      logger.log('SELECT QUERY======Iteration====pageState====', i, pageState);

      if (!pageState && i > 1) {
        return response;
      }

      const queryParams = [params.userIds],
        options = {
          prepare: true,
          fetchSize: selectQueryLimit,
          pageState: pageState
        };

      const queryRsp = await new UserNotificationModel().eachRow(queryString, queryParams, options, null, null);

      if (queryRsp.rows.length == 0) {
        return response;
      }

      pageState = queryRsp.pageState;

      for (let index = 0; index < queryRsp.rows.length; index++) {
        const row = queryRsp.rows[index];
        const formattedData = new UserNotificationModel().formatDbData(row);
        response[formattedData.userId] = response[formattedData.userId] || [];
        response[formattedData.userId].push(formattedData);
      }
    }
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    let cacheObject = await cacheProvider.getInstance();

    cacheObject.cacheInstance
      .delAll()
      .then(function() {
        console.log('--------Flushed memcached--------');
      })
      .catch(console.log);
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

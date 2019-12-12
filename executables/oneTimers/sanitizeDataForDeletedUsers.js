/**
 * Sanitize data for deleted users.
 *
 * Usage: node executables/oneTimers/sanitizeDataForDeletedUsers.js
 *
 * @module executables/oneTimers/sanitizeDataForDeletedUsers
 */

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  DeleteUserVideosLib = require(rootPrefix + '/lib/video/delete/UserVideos');

class SanitizeDataForDeletedUsers {
  /**
   * @constructor
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.inActiveUserIds = [];
  }

  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchInActiveUserIds();

    console.log('Inactive user ids: ', oThis.inActiveUserIds);

    for (let index = 0; index < oThis.inActiveUserIds.length; index++) {
      let userId = oThis.inActiveUserIds[index];

      let videoIds = await oThis._fetchVideoIdsForUserId(userId);

      if (videoIds && videoIds.length) {
        console.log(`-------Found active videos for inactive user id ${userId} \n videoIds ------> ${videoIds}`);
      }
    }

    const promisesArray = [];

    for (let index = 0; index < oThis.inActiveUserIds.length; index++) {
      promisesArray.push(
        new DeleteUserVideosLib({
          userId: oThis.inActiveUserIds[index],
          isUserAction: true
        }).perform()
      );
    }

    await Promise.all(promisesArray);
  }

  /**
   * Fetch inactive user ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchInActiveUserIds() {
    const oThis = this;

    let minUserId = -1;

    const limit = 30;

    while (true) {
      const rows = await new UserModel()
        .select('id')
        .where({ status: userConstants.invertedStatuses[userConstants.inActiveStatus] })
        .where(['id > ?', minUserId])
        .limit(limit)
        .order_by('id asc')
        .fire();

      if (rows.length == 0) {
        break;
      } else {
        for (let ind = 0; ind < rows.length; ind++) {
          oThis.inActiveUserIds.push(rows[ind].id);
          minUserId = rows[ind].id;
        }
      }
    }
  }

  /**
   * Fetch video ids.
   *
   * @param userId
   * @returns {Promise<[]>}
   * @private
   */
  async _fetchVideoIdsForUserId(userId) {
    const oThis = this;
    let videoIds = [];

    const dbRows = await new VideoDetailModel()
      .select('video_id')
      .where({ creator_user_id: userId })
      .where({ status: videoDetailsConstants.invertedStatuses[videoDetailsConstants.activeStatus] })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      videoIds.push(dbRows[index].video_id);
    }

    return videoIds;
  }
}

new SanitizeDataForDeletedUsers()
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(JSON.stringify(err));
    process.exit(1);
  });

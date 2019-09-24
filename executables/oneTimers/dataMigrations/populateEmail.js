const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  PreLaunchInviteByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByTwitterIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

const BATCH_SIZE = 25;

class PopulateEmail {
  constructor() {}

  /**
   * Async performer.
   *
   * @returns {Promise<boolean>}
   */
  async perform() {
    const oThis = this;

    let offset = 0;

    while (true) {
      oThis.userIdToEmailsMap = {};
      oThis.userIdToTwitterIdsMap = {};
      oThis.userIds = [];
      oThis.twitterIds = [];

      await oThis._getUserIds(BATCH_SIZE, offset);
      logger.log('User Ids: ', oThis.userIds);

      if (oThis.userIds.length === 0) {
        break;
      }

      await oThis._getTwitterUsers();

      await oThis._getPreLaunchInvites();

      await oThis._populateEmailInUsers();

      offset = offset + BATCH_SIZE;
    }
  }

  /**
   * Get userIds where email is NULL.
   *
   * @param limit
   * @param offset
   * @returns {Promise<void>}
   * @private
   */
  async _getUserIds(limit, offset) {
    const oThis = this;

    let dbRows = await new UserModel()
      .select('id')
      .where(['email IS NULL'])
      .limit(limit)
      .offset(offset)
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      oThis.userIds.push(dbRows[index].id);
    }
  }

  /**
   * Get twitter users.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getTwitterUsers() {
    const oThis = this;

    const dbRows = await new TwitterUserModel()
      .select('*')
      .where({
        user_id: oThis.userIds
      })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const twitterUser = new TwitterUserModel().formatDbData(dbRows[index]);

      if (twitterUser.id === twitterUser.twitterId) {
        logger.info('Rotated twitter user id: ', twitterUser.id);
        // Do nothing
      } else if (twitterUser.email !== null) {
        oThis.userIdToEmailsMap[twitterUser.userId] = twitterUser.email;
      } else {
        oThis.userIdToTwitterIdsMap[twitterUser.userId] = twitterUser.twitterId;
        oThis.twitterIds.push(twitterUser.twitterId);
      }
    }

    logger.log('oThis.userIdToEmailsMap : =============', oThis.userIdToEmailsMap);
    logger.log('oThis.userIdToTwitterIdsMap : =============', oThis.userIdToTwitterIdsMap);
    logger.log('oThis.twitterIds: ========', oThis.twitterIds);
  }

  /**
   * Get pre launch invites.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getPreLaunchInvites() {
    const oThis = this;

    if (oThis.twitterIds.length === 0) {
      return;
    }

    const preLaunchInviteCacheResp = await new PreLaunchInviteByTwitterIdsCache({
      twitterIds: oThis.twitterIds
    }).fetch();

    if (preLaunchInviteCacheResp.isFailure()) {
      return Promise.reject(preLaunchInviteCacheResp);
    }

    const preLaunchInviteCacheRespData = preLaunchInviteCacheResp.data;

    for (let index = 0; index < oThis.twitterIds.length; index++) {
      let twitterId = oThis.twitterIds[index],
        preLaunchInvite = preLaunchInviteCacheRespData[twitterId];

      if (preLaunchInvite.status === preLaunchInviteConstants.doptinStatus) {
        const userIdForTwitterId = oThis.userIdToTwitterIdsMap[twitterId];
        oThis.userIdToEmailsMap[userIdForTwitterId] = preLaunchInvite.email;
      }
    }
  }

  /**
   * Populate email in users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _populateEmailInUsers() {
    const oThis = this,
      promiseArray = [];

    for (let userId in oThis.userIdToEmailsMap) {
      const email = oThis.userIdToEmailsMap[userId];
      await new UserModel()
        .update({
          email: email
        })
        .where({
          id: userId
        })
        .fire()
        .catch(async function(err) {
          logger.error('Error while updating users table is: ', err);
        });

      promiseArray.push(new SecureUserCache({ id: userId }).clear());
    }

    // Flush cache;
    promiseArray.push(new UserCache({ ids: oThis.userIds }).clear());

    await Promise.all(promiseArray);
  }
}

const populateEmail = new PopulateEmail();

populateEmail
  .perform()
  .then(function(data) {
    logger.log('\nSuccess data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('\nError data: ', err);
    process.exit(1);
  });

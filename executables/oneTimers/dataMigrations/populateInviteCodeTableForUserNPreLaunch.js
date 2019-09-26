/**
 * One timer to populate invite code table for user N pre launch user.
 *
 * Usage: node executables/oneTimers/dataMigrations/populateInviteCodeTableForUserNPreLaunch.js
 *
 * @module executables/oneTimers/dataMigrations/populateInviteCodeTableForUserNPreLaunch
 */

const rootPrefix = '../../..',
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  InviteCodeByIdCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeById'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

class PopulateInviteCodeTableForUserNPreLaunch {
  constructor() {
    const oThis = this;
    oThis.totalRows = null;
    oThis.errorLogs = {};
  }

  async perform() {
    const oThis = this;

    return oThis._performBatch();
  }

  /**
   * Perform batch
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performBatch() {
    const oThis = this;

    let limit = 25,
      offset = 0;
    while (true) {
      await oThis._fetchPreLaunchUsers(limit, offset);
      // No more records present to migrate
      if (oThis.totalRows === 0) {
        break;
      }

      offset = offset + limit;
    }

    logger.log('The oThis.errorLogs are : ', oThis.errorLogs);
  }

  /**
   * Fetch pre launch invites
   *
   * @param limit
   * @param offset
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPreLaunchUsers(limit, offset) {
    const oThis = this;

    let preLaunchInvitesData = await new PreLaunchInviteModel()
      .select('*')
      .limit(limit)
      .offset(offset)
      .order_by('id asc')
      .fire();

    for (let index = 0; index < preLaunchInvitesData.length; index++) {
      const preLaunchInviteObj = new PreLaunchInviteModel().formatDbData(preLaunchInvitesData[index]);

      let inviteLimit =
          preLaunchInviteObj.creatorStatus === preLaunchInviteConstant.approvedCreatorStatus
            ? inviteCodeConstants.infiniteInviteLimit
            : inviteCodeConstants.inviteMaxLimit,
        params = {
          inviteCodeId: preLaunchInviteObj.inviteCodeId,
          inviterCodeId: preLaunchInviteObj.inviterCodeId,
          userId: await oThis._getUserIdForTwitterId(preLaunchInviteObj.twitterId),
          inviteLimit: inviteLimit
        };

      logger.log('The params.userId is : ', params.userId);
      if (params.userId) {
        await oThis._updateInviteCodeRecord(params);
      }
    }

    oThis.totalRows = preLaunchInvitesData.length;
  }

  /**
   * Get user id for twitter id
   *
   * @param preLaunchTwitterId
   * @returns {Promise<*>}
   * @private
   */
  async _getUserIdForTwitterId(preLaunchTwitterId) {
    const oThis = this;
    let twitterId = null;
    let twitterUserQueryRsp = await new TwitterUserModel()
      .select('*')
      .where({ twitter_id: preLaunchTwitterId })
      .fire();
    if (twitterUserQueryRsp[0] && twitterUserQueryRsp[0].id !== twitterUserQueryRsp[0].twitterId) {
      twitterId = twitterUserQueryRsp[0].user_id;
    }
    return twitterId;
  }

  /**
   * Update invite code record
   *
   * @param params
   * @returns {Promise<never>}
   * @private
   */
  async _updateInviteCodeRecord(params) {
    const oThis = this;

    const inviteCodeByIdCacheResponse = await new InviteCodeByIdCache({
      id: params.inviteCodeId
    }).fetch();

    if (inviteCodeByIdCacheResponse.isFailure()) {
      return Promise.reject(inviteCodeByIdCacheResponse);
    }

    let inviteCodeObj = inviteCodeByIdCacheResponse.data,
      inviterCodeId = inviteCodeObj.inviterCodeId,
      updateData = {
        user_id: params.userId,
        invite_limit: params.inviteLimit
      };

    if (inviterCodeId && inviterCodeId !== params.inviterCodeId) {
      oThis.errorLogs[params.userId] = {
        userId: params.userId,
        internalErrorCode: 'Inviter code id mismatch found.'
      };
    }

    await new InviteCodeModel()
      .update(updateData)
      .where({ id: params.inviteCodeId })
      .fire();

    if (inviterCodeId) {
      await new InviteCodeModel().updateInvitedUserCount(inviterCodeId);
    }

    await InviteCodeModel.flushCache(inviteCodeObj);
  }
}

new PopulateInviteCodeTableForUserNPreLaunch()
  .perform()
  .then(function(r) {
    logger.win('All approved creators are sync in pre-launch and users.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error: ', err);
    process.exit(1);
  });

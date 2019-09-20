/**
 * One timer to seed invite code tables.
 *
 * Usage: node executables/oneTimers/seedInviteCode.js
 *
 * @module executables/oneTimers/seedInviteCode
 */
const command = require('commander');

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  AdminModel = require(rootPrefix + '/app/models/mysql/Admin'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ApproveUserService = require(rootPrefix + '/app/services/admin/ApproveUsersAsCreator'),
  ApprovePreLaunchUserService = require(rootPrefix + '/app/services/admin/preLaunch/ApproveUser'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  PreLaunchInviteByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByIds'),
  PreLaunchInviteByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByTwitterIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

command
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --userId <userId>', 'id of the users table')
  .parse(process.argv);

/**
 * class for seed invite code tables.
 *
 * @class
 */
class SeedInviteCode {
  /**
   * constructor to seed invite code tables.
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._performBatch();
  }

  /**
   * Perform batch
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performBatch() {
    const oThis = this;

    oThis.userId = command.userId ? command.userId : 0;

    oThis.currentAdminObj = await oThis._fetchAdmin();
    oThis.errorLogs = {};

    let limit = 10,
      offset = 0;
    while (true) {
      await oThis._fetchUsers(limit, offset);
      // No more records present to migrate
      if (oThis.totalRows === 0) {
        break;
      }

      offset = offset + 10;
    }

    console.log('The oThis.errorLogs are : ', oThis.errorLogs);
  }

  /**
   * Fetch users
   *
   * @param limit
   * @param offset
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUsers(limit, offset) {
    const oThis = this;

    let twitterIds = [];
    let userIds = [];
    let usersByIdMap = {};
    let userIdToTwitterIdMap = {};
    let preLaunchInviteByTwitterIds = {};
    let inviteCodeByUserIds = {};

    let usersData = await new UserModel()
      .select('*')
      .where(['id > (?)', oThis.userId])
      .limit(limit)
      .offset(offset)
      .fire();

    oThis.totalRows = usersData.length;

    for (let index = 0; index < usersData.length; index++) {
      const formatDbRow = new UserModel().formatDbData(usersData[index]);
      let userId = formatDbRow.id;
      usersByIdMap[userId] = formatDbRow;
      let twitterId = await oThis._getTwitterId(userId);
      console.log('The twitterId is : ', twitterId);
      twitterIds.push(twitterId);
      userIdToTwitterIdMap[userId] = twitterId;
      userIds.push(userId);
    }

    const inviteCodeByUserIdCacheResponse = await new InviteCodeByUserIdsCache({
      userIds: userIds
    }).fetch();

    console.log('The userIds are : ', userIds);

    if (inviteCodeByUserIdCacheResponse.isFailure()) {
      return Promise.reject(inviteCodeByUserIdCacheResponse);
    }
    inviteCodeByUserIds = inviteCodeByUserIdCacheResponse.data;

    console.log('The inviteCodeByUserIds is : ', inviteCodeByUserIds);

    const preLaunchInviteByTwitterIdsCacheResp = await new PreLaunchInviteByTwitterIdsCache({
      twitterIds: twitterIds
    }).fetch();

    if (preLaunchInviteByTwitterIdsCacheResp.isFailure()) {
      return Promise.reject(preLaunchInviteByTwitterIdsCacheResp);
    }

    // this cache give only id, twitter_id for every object
    preLaunchInviteByTwitterIds = preLaunchInviteByTwitterIdsCacheResp.data;

    console.log('The preLaunchInviteByTwitterIds is : ', preLaunchInviteByTwitterIds);

    for (let id in usersByIdMap) {
      let userObj = usersByIdMap[id],
        isCreator = UserModel.isUserApprovedCreator(userObj),
        isPreLaunchCreator = true,
        twitterId = userIdToTwitterIdMap[id],
        preLaunchInviteByTwitterIdObj = {},
        preLaunchInviteObj = {};

      if (preLaunchInviteByTwitterIds.length > 0) {
        // here we always will not get the preLaunchInviteByTwitterIdObj because of the twitter rotate
        // after rotation the twitter id of twitter_user table and preLaunchInvite table will be different
        console.log('The preLaunchInviteByTwitterIdObj is : ', preLaunchInviteByTwitterIdObj);
      }

      if (CommonValidators.validateNonEmptyObject(preLaunchInviteByTwitterIds[twitterId])) {
        preLaunchInviteByTwitterIdObj = preLaunchInviteByTwitterIds[twitterId];
        const cacheRsp = await new PreLaunchInviteByIdsCache({ ids: [preLaunchInviteByTwitterIdObj.id] }).fetch();
        if (cacheRsp.isFailure()) {
          return cacheRsp;
        }

        preLaunchInviteObj = cacheRsp.data[preLaunchInviteByTwitterIdObj.id];
        if (preLaunchInviteObj.creatorStatus !== preLaunchInviteConstant.approvedCreatorStatus) {
          isPreLaunchCreator = false;
        }
      }

      console.log('The id is : ', id);

      console.log('The inviteCodeByUserIds[id] is : ', inviteCodeByUserIds[id]);

      if (!CommonValidators.validateNonEmptyObject(inviteCodeByUserIds[id])) {
        //insert into invite code
        console.log('The inviteCodeByUserIds[id] is : ', inviteCodeByUserIds[id]);
        let inviteCode = inviteCodeConstants.generateInviteCode,
          inviteLimit = isCreator ? inviteCodeConstants.infiniteInviteLimit : inviteCodeConstants.inviteMaxLimit;

        let insertData = {
          code: inviteCode,
          invite_limit: inviteLimit,
          user_id: id
        };

        await new InviteCodeModel()._insert(insertData);
      }

      if (!isCreator && isPreLaunchCreator) {
        await oThis._approveUser(id);
      }

      if (isCreator && !isPreLaunchCreator) {
        await oThis._approvePreLaunchUser(preLaunchInviteObj.id);
      }
    }
  }

  /**
   * Get twitter id for user
   * @param userId
   * @returns {Promise<*>}
   * @private
   */
  async _getTwitterId(userId) {
    const oThis = this;

    const twitterUserCacheRsp = await new TwitterUserByUserIdsCache({
      userIds: [userId]
    }).fetch();

    let twitterUserObj = twitterUserCacheRsp.data[userId];

    const TwitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: [twitterUserObj.id]
    }).fetch();

    return TwitterUserByIdsCacheResp.data[twitterUserObj.id].twitterId;
  }

  /**
   * Fetch admin
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchAdmin() {
    const oThis = this;

    let row = await new AdminModel()
      .select('*')
      .where({ status: adminConstants.invertedStatuses[adminConstants.activeStatus] })
      .limit(1)
      .fire();

    return row[0];
  }

  /**
   * Approve pre launch user
   *
   * @param preLaunchInviteId
   * @returns {Promise<never>}
   * @private
   */
  async _approvePreLaunchUser(preLaunchInviteId) {
    const oThis = this;

    console.log('The preLaunchInviteId for _approvePreLaunchUser is : ', preLaunchInviteId);

    let rsp = await new ApprovePreLaunchUserService({ invite_id: preLaunchInviteId }).perform();

    if (rsp.isFailure()) {
      oThis.errorLogs[preLaunchInviteId] = {
        preLaunchInviteId: preLaunchInviteId,
        internalErrorCode: rsp.internalErrorCode
      };
    }

    return responseHelper.successWithData({});
  }

  /**
   * Approve user
   *
   * @param userId
   * @returns {Promise<never>}
   * @private
   */
  async _approveUser(userId) {
    const oThis = this;
    console.log('The userId for _approveUser is : ', userId);
    let rsp = await new ApproveUserService({
      user_ids: [userId],
      current_admin: oThis.currentAdminObj
    }).perform();

    if (rsp.isFailure()) {
      oThis.errorLogs[userId] = {
        userId: userId,
        internalErrorCode: rsp.internalErrorCode
      };
    }
    return responseHelper.successWithData({});
  }
}

new SeedInviteCode({})
  .perform()
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });

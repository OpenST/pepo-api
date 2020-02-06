/**
 * One timer to sync creator approval.
 *
 * Usage: node executables/oneTimers/dataMigrations/syncCreatorApproval.js
 *
 * @module executables/oneTimers/dataMigrations/syncCreatorApproval
 */
const command = require('commander');

const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AdminModel = require(rootPrefix + '/app/models/mysql/admin/Admin'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminConstants = require(rootPrefix + '/lib/globalConstant/admin/admin'),
  ApproveUserService = require(rootPrefix + '/app/services/admin/ApproveUsersAsCreator'),
  ApprovePreLaunchUserService = require(rootPrefix + '/app/services/admin/preLaunch/ApproveUser'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  PreLaunchInviteByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByIds'),
  PreLaunchInviteByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByTwitterIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  preLaunchInviteConstant = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

command
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --userId <userId>', 'id of the users table')
  .parse(process.argv);

class SyncCreatorApproval {
  constructor() {
    const oThis = this;
    oThis.currentAdminObj = null;
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

    oThis.userId = command.userId ? command.userId : 0;

    oThis.currentAdminObj = await oThis._fetchAdmin();

    let limit = 25,
      offset = 0;
    while (true) {
      await oThis._fetchUsers(limit, offset);
      // No more records present to migrate
      if (oThis.totalRows === 0) {
        break;
      }

      offset = offset + limit;
    }

    logger.log('The oThis.errorLogs are : ', oThis.errorLogs);
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
    let usersByIdMap = {};
    let userIdToTwitterIdMap = {};
    let preLaunchInviteByTwitterIds = {};

    let usersData = await new UserModel()
      .select('*')
      .where(['id > (?)', oThis.userId])
      .where(['status NOT IN (?)', userConstants.invertedStatuses[userConstants.inActiveStatus]])
      .limit(limit)
      .offset(offset)
      .order_by('id asc')
      .fire();

    oThis.totalRows = usersData.length;

    for (let index = 0; index < oThis.totalRows; index++) {
      const formatDbRow = new UserModel().formatDbData(usersData[index]);
      let userId = formatDbRow.id;
      usersByIdMap[userId] = formatDbRow;
      let twitterId = await oThis._getTwitterId(userId);
      twitterIds.push(twitterId);
      userIdToTwitterIdMap[userId] = twitterId;
    }

    const preLaunchInviteByTwitterIdsCacheResp = await new PreLaunchInviteByTwitterIdsCache({
      twitterIds: twitterIds
    }).fetch();

    if (preLaunchInviteByTwitterIdsCacheResp.isFailure()) {
      return Promise.reject(preLaunchInviteByTwitterIdsCacheResp);
    }

    // this cache give only id, twitter_id for every object
    preLaunchInviteByTwitterIds = preLaunchInviteByTwitterIdsCacheResp.data;

    logger.log('The preLaunchInviteByTwitterIds is : ', preLaunchInviteByTwitterIds);

    for (let userId in usersByIdMap) {
      let userObj = usersByIdMap[userId],
        isUserCreator = UserModel.isUserApprovedCreator(userObj),
        isPreLaunchCreator = false,
        twitterId = userIdToTwitterIdMap[userId],
        preLaunchInviteByTwitterIdObj = {},
        preLaunchInviteObj = {};

      // skip rotated user
      if (CommonValidators.validateNonEmptyObject(preLaunchInviteByTwitterIds[twitterId])) {
        preLaunchInviteByTwitterIdObj = preLaunchInviteByTwitterIds[twitterId];
        const cacheRsp = await new PreLaunchInviteByIdsCache({ ids: [preLaunchInviteByTwitterIdObj.id] }).fetch();
        if (cacheRsp.isFailure()) {
          return cacheRsp;
        }

        preLaunchInviteObj = cacheRsp.data[preLaunchInviteByTwitterIdObj.id];
        if (preLaunchInviteObj.creatorStatus === preLaunchInviteConstant.approvedCreatorStatus) {
          isPreLaunchCreator = true;
        }

        if (!isUserCreator && isPreLaunchCreator) {
          await oThis._approveUser(userId);
        }

        if (isUserCreator && !isPreLaunchCreator) {
          await oThis._approvePreLaunchUser(preLaunchInviteObj.id);
        }
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

    logger.log('The preLaunchInviteId for _approvePreLaunchUser is : ', preLaunchInviteId);

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
    logger.log('The userId for _approveUser is : ', userId);
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

// The one timer will give err_code_for_log:  pepoApi(a_s_auac_1:cFXBKsde4)
// internalErrorId:  a_s_auac_1 apiErrorId:  something_went_wrong debugOptions:  {"userId":"1025"} error like this

new SyncCreatorApproval()
  .perform()
  .then(function(r) {
    logger.win('All approved creators are sync in pre-launch and users.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error: ', err);
    process.exit(1);
  });

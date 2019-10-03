/**
 * One timer to seed invite code tables for non pre launch user.
 *
 * Usage: node executables/oneTimers/dataMigrations/createInviteCode.js
 *
 * @module executables/oneTimers/dataMigrations/createInviteCode
 */
const command = require('commander');

const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  PreLaunchInviteByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByTwitterIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

command
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --userId <userId>', 'id of the users table')
  .parse(process.argv);

/**
 * class for seed invite code tables for non pre launch user.
 *
 * @class
 */
class CreateInviteCode {
  /**
   * constructor to seed invite code tables for non pre launch user.
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
      .order_by('id asc')
      .fire();

    oThis.totalRows = usersData.length;

    for (let index = 0; index < oThis.totalRows; index++) {
      const user = new UserModel().formatDbData(usersData[index]);
      let userId = user.id;
      usersByIdMap[userId] = user;
      let twitterId = await oThis._getTwitterId(userId);
      twitterIds.push(twitterId);
      userIdToTwitterIdMap[userId] = twitterId;
      userIds.push(userId);
    }

    const inviteCodeByUserIdCacheResponse = await new InviteCodeByUserIdsCache({
      userIds: userIds
    }).fetch();

    logger.log('The userIds are : ', userIds);

    if (inviteCodeByUserIdCacheResponse.isFailure()) {
      return Promise.reject(inviteCodeByUserIdCacheResponse);
    }
    inviteCodeByUserIds = inviteCodeByUserIdCacheResponse.data;

    logger.log('The inviteCodeByUserIds is : ', inviteCodeByUserIds);

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
        isCreator = UserModel.isUserApprovedCreator(userObj),
        twitterId = userIdToTwitterIdMap[userId];

      if (
        !CommonValidators.validateNonEmptyObject(inviteCodeByUserIds[userId]) &&
        !CommonValidators.validateNonEmptyObject(preLaunchInviteByTwitterIds[twitterId])
      ) {
        //insert into invite code
        let inviteCode = inviteCodeConstants.generateInviteCode,
          inviteLimit = isCreator ? inviteCodeConstants.infiniteInviteLimit : inviteCodeConstants.inviteMaxLimit;

        let insertData = {
          code: inviteCode,
          invite_limit: inviteLimit,
          user_id: userId
        };

        await new InviteCodeModel()._insert(insertData);
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
}

new CreateInviteCode({})
  .perform()
  .then(function(rsp) {
    logger.win('Script exited successfully.', rsp);
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });

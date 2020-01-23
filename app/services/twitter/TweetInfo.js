const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/connect/wrappers/twitter/oAuth1.0/Account'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  CurrentUser = require(rootPrefix + '/app/services/user/init/GetCurrent'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended');

// TODO: To be deprecated. This service is not used now.
/**
 * Class for tweet info.
 *
 * @class TweetInfo
 */
class TweetInfo extends ServiceBase {
  /**
   * Constructor for getting receiver twitter info
   *
   * @param {object} params
   * @param {number} params.receiver_user_id
   * @param {string} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.receiverUserId = +params.receiver_user_id;
    oThis.currentUser = params.current_user;
    oThis.currentUserId = +params.current_user.id;

    oThis.twitterUsersMap = {};
    oThis.serviceResponse = {};
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchTwitterUsers();

    await oThis._fetchAndValidateUser(oThis.currentUserId);

    await oThis._fetchCurrentUser();

    return responseHelper.successWithData(oThis.serviceResponse);
  }

  /**
   * Fetch Twitter User Obj if present.
   *
   * @sets oThis.twitterUsersMap
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUsers() {
    const oThis = this;

    logger.log('Start::Fetch Twitter Users');

    const twitterUserByUserIdsCacheResponse = await new TwitterUserByUserIdsCache({
      userIds: [oThis.receiverUserId, oThis.currentUserId]
    }).fetch();

    if (twitterUserByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResponse);
    }

    let twitterUserIds = [];
    for (let userId in twitterUserByUserIdsCacheResponse.data) {
      if (twitterUserByUserIdsCacheResponse.data[userId].id) {
        twitterUserIds.push(twitterUserByUserIdsCacheResponse.data[userId].id);
      }
    }

    const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: twitterUserIds
    }).fetch();

    if (twitterUserByIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByIdsCacheResp);
    }

    for (let id in twitterUserByIdsCacheResp.data) {
      let twitterUser = twitterUserByIdsCacheResp.data[id];

      oThis.twitterUsersMap[twitterUser.userId] = twitterUser;
    }

    if (!oThis.twitterUsersMap.hasOwnProperty(oThis.receiverUserId)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_u_n_ti_ftu_1',
          api_error_identifier: 'invalid_receiver_user_id',
          debug_options: {}
        })
      );
    }

    oThis.serviceResponse['twitterUsersMap'] = oThis.twitterUsersMap;

    logger.log('End::Fetch Twitter Users');
    return responseHelper.successWithData({});
  }

  /**
   * Fetch and validate user with twitter
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchAndValidateUser(userId) {
    const oThis = this;

    let twitterId = oThis.twitterUsersMap[userId].twitterId,
      twitterUserId = oThis.twitterUsersMap[userId].id,
      handle = oThis.twitterUsersMap[userId].handle;

    let twitterExtendedData = await oThis._fetchTwitterUserExtended(twitterUserId);

    if (twitterExtendedData.status == twitterUserExtendedConstants.activeStatus) {
      oThis.token = twitterExtendedData.token;
      oThis.secret = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, twitterExtendedData.secretLc);

      let validateRsp = await oThis._validateTwitterCredentials(twitterId, handle);

      if (validateRsp.isFailure() && validateRsp.apiErrorIdentifier === 'twitter_unauthorized') {
        await oThis._expireCurrentUserTwitterAuthIfRequired(twitterExtendedData.id);
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch Twitter User Extended Obj if present.
   *
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUserExtended(twitterUserId) {
    const oThis = this;

    const secureTwitterUserExtendedRes = await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserId: twitterUserId
    }).fetch();

    if (secureTwitterUserExtendedRes.isFailure()) {
      return Promise.reject(secureTwitterUserExtendedRes);
    }

    return secureTwitterUserExtendedRes.data;
  }

  /**
   * Verify Credentials and get profile data from twitter.
   *
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validateTwitterCredentials(twitterId, handle) {
    const oThis = this;
    logger.log('Start::Validate Twitter Credentials');

    let twitterResp = null;

    twitterResp = await new AccountTwitterRequestClass().verifyCredentials({
      oAuthToken: oThis.token,
      oAuthTokenSecret: oThis.secret
    });

    if (twitterResp.isFailure()) {
      return twitterResp;
    }

    let userTwitterEntity = twitterResp.data.userEntity;

    if (userTwitterEntity.idStr != twitterId) {
      // Check if this needs to be errored out
      return responseHelper.error({
        internal_error_identifier: 's_u_n_ti_vtc_3',
        api_error_identifier: 'invalid_twitter_user',
        debug_options: {}
      });
    }

    // Update handle in DB - to be in sync with the latest one
    if (!handle || userTwitterEntity.handle.toLowerCase() != handle.toLowerCase()) {
      await new TwitterUserModel()
        .update({ handle: userTwitterEntity.handle })
        .where({ id: oThis.twitterUsersMap[oThis.currentUserId].id })
        .fire();

      await TwitterUserModel.flushCache(oThis.twitterUsersMap[oThis.currentUserId]);
      oThis.serviceResponse['twitterUsersMap'][oThis.currentUserId].handle = userTwitterEntity.handle;
    }

    logger.log('End::Validate Twitter Credentials');

    return responseHelper.successWithData({});
  }

  /**
   * Expire twitter auth of current user if required
   *
   *
   * @return {Promise<Result>}
   * @private
   */
  async _expireCurrentUserTwitterAuthIfRequired(twitterExtendedId) {
    const oThis = this;

    logger.log('Start::Update Twitter User Extended for tweet info', oThis.twitterUsersMap[oThis.currentUserId]);

    await new TwitterUserExtendedModel()
      .update({
        access_type: twitterUserExtendedConstants.invertedAccessTypes[twitterUserExtendedConstants.noneAccessType],
        status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.expiredStatus]
      })
      .where({ id: twitterExtendedId })
      .fire();

    await TwitterUserExtendedModel.flushCache({
      id: twitterExtendedId,
      twitterUserId: oThis.twitterUsersMap[oThis.currentUserId].id
    });

    logger.log('End::Update Twitter User Extended for say thank you', oThis.twitterUsersMap[oThis.currentUserId]);
  }

  /**
   * Fetch current user
   *
   * @sets oThis.currentUser
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchCurrentUser() {
    const oThis = this;

    let currentUser = new CurrentUser({ current_user: oThis.currentUser });

    let currentUserRsp = await currentUser.perform();

    if (currentUserRsp.isFailure()) {
      return currentUserRsp;
    }

    let currentUserData = currentUserRsp.data;

    Object.assign(oThis.serviceResponse, currentUserData);
  }
}

module.exports = TweetInfo;

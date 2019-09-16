const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Account'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  UsersTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Users'),
  CurrentUser = require(rootPrefix + '/app/services/user/init/GetCurrent'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended');

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

    await oThis._fetchReceiverHandle();

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
      twitterUserIds.push(twitterUserByUserIdsCacheResponse.data[userId].id);
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

    oThis.token = twitterExtendedData.token;
    oThis.secret = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, twitterExtendedData.secretLc);

    if (twitterExtendedData.status == twitterUserExtendedConstants.activeStatus) {
      let validateRsp = await oThis._validateTwitterCredentials(twitterId, handle);

      if (validateRsp.isFailure()) {
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

    twitterResp = await new AccountTwitterRequestClass()
      .verifyCredentials({
        oAuthToken: oThis.token,
        oAuthTokenSecret: oThis.secret
      })
      .catch(function(err) {
        logger.error('Error while validating Credentials for twitter: ', err);
        return responseHelper.error({
          internal_error_identifier: 's_u_n_ti_vtc_1',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        });
      });

    if (twitterResp.isFailure()) {
      return responseHelper.error({
        internal_error_identifier: 's_u_n_ti_vtc_2',
        api_error_identifier: 'unauthorized_api_request',
        debug_options: {}
      });
    }

    let userTwitterEntity = twitterResp.data.userEntity;

    if (userTwitterEntity.idStr != twitterId) {
      // Check if this needs to be errored out
      return responseHelper.error({
        internal_error_identifier: 's_u_n_ti_vtc_3',
        api_error_identifier: 'unauthorized_api_request',
        debug_options: {}
      });
    }

    // Update handle in DB - to be in sync with the latest one
    if (userTwitterEntity.handle != handle) {
      await new TwitterUserModel()
        .update({ handle: userTwitterEntity.handle })
        .where({ id: oThis.twitterUsersMap[oThis.currentUserId].id })
        .fire();

      await TwitterUserModel.flushCache(oThis.twitterUsersMap[oThis.currentUserId]);
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
   * Fetch receiver twitter handle
   *
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchReceiverHandle() {
    const oThis = this;

    let twitterUsers = new UsersTwitterRequestClass({});

    let twitterId = oThis.twitterUsersMap[oThis.receiverUserId].twitterId;

    let lookupRsp = await twitterUsers.lookup({
      token: oThis.token,
      secret: oThis.secret,
      twitterIds: [twitterId]
    });

    if (lookupRsp.isFailure()) {
      oThis.twitterUsersMap[oThis.receiverUserId].handle = null;
    }

    await new TwitterUserModel()
      .update({ handle: lookupRsp.data[twitterId].handle })
      .where({ id: oThis.twitterUsersMap[oThis.receiverUserId].id })
      .fire();

    await TwitterUserModel.flushCache(oThis.twitterUsersMap[oThis.receiverUserId]);

    oThis.serviceResponse['twitterUsersMap'] = oThis.twitterUsersMap;
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

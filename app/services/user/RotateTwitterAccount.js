const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  UserByUserNameCache = require(rootPrefix + '/lib/cacheManagement/single/UserByUsername'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds');

/**
 * Class for rotate twitter account
 *
 * @class
 */
class RotateTwitterAccount extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   * @param params.user_name {String} - user name
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userName = params.user_name;
    oThis.user = {};
    oThis.userId = null;
    oThis.currentUserTwitterUserId = null;
    oThis.currentUserTwitterUserId = null;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUser();

    await oThis._fetchTwitterUser();

    await oThis._rotateTwitterAccount();

    await oThis._clearTwitterUserCache();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch user.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheRsp = await new UserByUserNameCache({ userName: oThis.userName }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.user = cacheRsp.data;
    oThis.userId = oThis.user.id;
  }

  /**
   * Fetch twitter user
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTwitterUser() {
    const oThis = this;

    let TwitterUserByUserIdsCacheResp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.userId]
    }).fetch();

    if (TwitterUserByUserIdsCacheResp.isFailure()) {
      return Promise.reject(TwitterUserByUserIdsCacheResp);
    }

    //should always be present;
    oThis.currentUserTwitterUserId = TwitterUserByUserIdsCacheResp.data[oThis.userId].id;

    let TwitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: [oThis.currentUserTwitterUserId]
    }).fetch();

    if (TwitterUserByIdsCacheResp.isFailure()) {
      return Promise.reject(TwitterUserByIdsCacheResp);
    }

    oThis.currentUserTwitterUserTwitterId = TwitterUserByIdsCacheResp.data[oThis.currentUserTwitterUserId].twitterId;
  }

  /**
   * Rotate twitter account
   *
   * @returns {Promise<void>}
   * @private
   */
  async _rotateTwitterAccount() {
    const oThis = this;
    if (oThis.currentUserTwitterUserTwitterId === oThis.currentUserTwitterUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_rta_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_twitter_user'],
          debug_options: {
            currentUserTwitterUserTwitterId: oThis.currentUserTwitterUserTwitterId,
            currentUserTwitterUserId: oThis.currentUserTwitterUserId
          }
        })
      );
    }
    await new TwitterUserModel()
      .update({ twitter_id: oThis.currentUserTwitterUserId })
      .where({ id: oThis.currentUserTwitterUserId })
      .fire();
  }

  async _clearTwitterUserCache() {
    const oThis = this;
    await new TwitterUserByTwitterIdsCache({
      twitterIds: [oThis.currentUserTwitterUserTwitterId]
    }).clear();

    await new TwitterUserByIdsCache({
      ids: [oThis.currentUserTwitterUserId]
    }).clear();

    await new TwitterUserByUserIdsCache({
      userIds: [oThis.userId]
    }).clear();
  }
}

module.exports = RotateTwitterAccount;

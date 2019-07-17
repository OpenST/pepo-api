const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  UserByUserNameCache = require(rootPrefix + '/lib/cacheManagement/single/UserByUsername'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds');

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
   * @param params.current_user {object} - current_user
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userName = params.user_name;
    oThis.currentUserId = +params.current_user.id;
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
    oThis.currentUserTwitterUserTwitterId = TwitterUserByUserIdsCacheResp.data[oThis.userId].twitterId;
    oThis.currentUserTwitterUserId = TwitterUserByUserIdsCacheResp.data[oThis.userId].id;
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
      .where({ twitter_id: oThis.currentUserTwitterUserTwitterId })
      .fire();
  }

  async _clearTwitterUserCache() {
    const oThis = this;
    const TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds');
    await new TwitterUserByTwitterIdsCache({
      twitterIds: [oThis.currentUserTwitterUserTwitterId]
    }).clear();

    const TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds');
    await new TwitterUserByIdsCache({
      ids: [oThis.currentUserTwitterUserId]
    }).clear();

    await new TwitterUserByUserIdsCache({
      userIds: [oThis.userId]
    }).clear();
  }
}

module.exports = RotateTwitterAccount;

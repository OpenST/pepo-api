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
    oThis.userId = null;
    oThis.twitterUserObj = {};
    oThis.twitterUserId = null;
    oThis.twitterUserTwitterId = null;
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

    if (!cacheRsp.data.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_rta_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: { userName: oThis.userName }
        })
      );
    }

    oThis.userId = cacheRsp.data.id;
  }

  /**
   * Fetch twitter user
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTwitterUser() {
    const oThis = this;

    const TwitterUserByUserIdsCacheResp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.userId]
    }).fetch();

    if (TwitterUserByUserIdsCacheResp.isFailure()) {
      return Promise.reject(TwitterUserByUserIdsCacheResp);
    }

    const twitterUserByUserIdObj = TwitterUserByUserIdsCacheResp.data[oThis.userId];
    if (!twitterUserByUserIdObj.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_rta_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: { userName: oThis.userName }
        })
      );
    }

    // Should always be present.
    oThis.twitterUserId = twitterUserByUserIdObj.id;

    const TwitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: [oThis.twitterUserId]
    }).fetch();

    if (TwitterUserByIdsCacheResp.isFailure()) {
      return Promise.reject(TwitterUserByIdsCacheResp);
    }

    oThis.twitterUserObj = TwitterUserByIdsCacheResp.data[oThis.twitterUserId];
    if (!oThis.twitterUserObj.twitterId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_rta_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: { userName: oThis.userName }
        })
      );
    }

    oThis.twitterUserTwitterId = oThis.twitterUserObj.twitterId;
  }

  /**
   * Rotate twitter account
   *
   * @returns {Promise<void>}
   * @private
   */
  async _rotateTwitterAccount() {
    const oThis = this;
    if (oThis.twitterUserTwitterId === oThis.twitterUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_rta_4',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_twitter_user'],
          debug_options: {
            twitterUserTwitterId: oThis.twitterUserTwitterId,
            twitterUserId: oThis.twitterUserId
          }
        })
      );
    }
    await new TwitterUserModel()
      .update({ twitter_id: oThis.twitterUserId })
      .where({ id: oThis.twitterUserId })
      .fire();
    oThis.twitterUserObj.twitterId = oThis.twitterUserId;
  }

  /**
   * Clear twitter user cache
   * @returns {Promise<void>}
   * @private
   */
  async _clearTwitterUserCache() {
    const oThis = this;

    await new TwitterUserByTwitterIdsCache({
      twitterIds: [oThis.twitterUserTwitterId]
    }).clear();

    await TwitterUserModel.flushCache(oThis.twitterUserObj);
  }
}

module.exports = RotateTwitterAccount;

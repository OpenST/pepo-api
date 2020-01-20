const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  UserUniqueIdentifierModel = require(rootPrefix + '/app/models/mysql/UserIdentifier'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class to rotate twitter account.
 *
 * @class RotateTwitterAccount
 */
class RotateTwitterAccount extends ServiceBase {
  /**
   * Constructor to rotate twitter account.
   *
   * @param {object} params
   * @param {string} params.user_name: user name
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userName = params.user_name;

    oThis.userId = null;
    oThis.twitterUserObj = {};
    oThis.twitterUserId = null;
    oThis.twitterUserTwitterId = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUser();

    await oThis._fetchTwitterUser();

    await oThis._rotateTwitterAccount();

    await oThis._clearTwitterUserCache();

    await oThis._deleteTwitterUserExtended();

    await oThis._markUserEmailAsNull();

    await oThis._deleteUniqueUserIdentifier();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch user.
   *
   * @sets oThis.userId
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheRsp = await new UserIdByUserNamesCache({ userNames: [oThis.userName] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (!cacheRsp.data[oThis.userName].id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_rta_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: { userName: oThis.userName }
        })
      );
    }

    oThis.userId = cacheRsp.data[oThis.userName].id;
  }

  /**
   * Fetch twitter user.
   *
   * @sets oThis.twitterUserId, oThis.twitterUserObj, oThis.twitterUserTwitterId
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTwitterUser() {
    const oThis = this;

    const twitterUserByUserIdsCacheResp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.userId]
    }).fetch();
    if (twitterUserByUserIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResp);
    }

    const twitterUserByUserIdObj = twitterUserByUserIdsCacheResp.data[oThis.userId];
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

    const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: [oThis.twitterUserId]
    }).fetch();
    if (twitterUserByIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByIdsCacheResp);
    }

    oThis.twitterUserObj = twitterUserByIdsCacheResp.data[oThis.twitterUserId];
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
   * Rotate twitter account.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _rotateTwitterAccount() {
    const oThis = this;

    if (basicHelper.isTwitterIdRotated(oThis.twitterUserTwitterId)) {
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

    const negatedTwitterId = '-' + oThis.twitterUserId.toString();

    await new TwitterUserModel()
      .update({ twitter_id: negatedTwitterId })
      .where({ id: oThis.twitterUserId })
      .fire();
  }

  /**
   * Delete twitter user extended obj for twitter user id.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteTwitterUserExtended() {
    const oThis = this;

    await new TwitterUserExtendedModel()
      .delete()
      .where({ twitter_user_id: oThis.twitterUserId })
      .fire();

    await TwitterUserExtendedModel.flushCache({ twitterUserId: oThis.twitterUserId });
  }

  /**
   * Clear twitter user cache.
   *
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

  /**
   * Mark user email as null
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markUserEmailAsNull() {
    const oThis = this;

    await new UserModel()
      .update({ email: null })
      .where({ id: oThis.userId })
      .fire();

    await UserModel.flushCache({ id: oThis.userId });
  }

  /**
   * Delte user identifier.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteUniqueUserIdentifier() {
    const oThis = this;

    await new UserUniqueIdentifierModel()
      .delete()
      .where({ user_id: oThis.userId })
      .fire();
  }
}

module.exports = RotateTwitterAccount;

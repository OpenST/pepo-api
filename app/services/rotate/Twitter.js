const rootPrefix = '../../..',
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class to rotate account.
 *
 * @class RotateTwitterAccount
 */
class RotateTwitterAccount {
  /**
   * Constructor to rotate twitter account.
   *
   * @param {object} params
   * @param {string} params.userId: user id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.twitterUserId = null;
    oThis.twitterUserObj = null;
    oThis.twitterUserTwitterId = null;
  }

  async perform() {
    const oThis = this;

    await oThis._fetchSocialUser();
    await oThis._rotateAccount();
    await oThis._deleteSocialUserExtended();
  }

  /**
   * Fetch social user
   * @returns {Promise<never>}
   * @private
   */
  async _fetchSocialUser() {
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
          internal_error_identifier: 'a_s_r_t_1',
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
          internal_error_identifier: 'a_s_r_t_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: { userName: oThis.userName }
        })
      );
    }

    oThis.twitterUserTwitterId = oThis.twitterUserObj.twitterId;
  }

  /**
   * Rotate social account
   * @returns {Promise<void>}
   * @private
   */
  async _rotateAccount() {
    const oThis = this;

    if (basicHelper.isTwitterIdRotated(oThis.twitterUserTwitterId)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_r_t_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_twitter_user'],
          debug_options: {
            twitterUserTwitterId: oThis.twitterUserTwitterId,
            twitterUserId: oThis.twitterUserId
          }
        })
      );
    }

    const negatedTwitterUserId = '-' + oThis.twitterUserId.toString();

    await new TwitterUserModel()
      .update({ twitter_id: negatedTwitterUserId })
      .where({ id: oThis.twitterUserId })
      .fire();

    await TwitterUserModel.flushCache({
      id: oThis.twitterUserObj.id,
      userId: oThis.twitterUserObj.userId,
      twitterId: oThis.twitterUserTwitterId
    });
  }

  /**
   * Delete twitter user extended obj for twitter user id.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteSocialUserExtended() {
    const oThis = this;

    await new TwitterUserExtendedModel()
      .delete()
      .where({ twitter_user_id: oThis.twitterUserId })
      .fire();

    await TwitterUserExtendedModel.flushCache({ twitterUserId: oThis.twitterUserId });
  }
}

module.exports = RotateTwitterAccount;

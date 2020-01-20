const rootPrefix = '../../../../..',
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  TweetMessage = require(rootPrefix + '/lib/connect/wrappers/twitter/oAuth1.0/Tweet'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

// TODO: To be deprecated. This lib file doesn't have any usages.
/**
 * Class for tweet by user id
 *
 * @class TweetByUserId
 */
class TweetByUserId {
  /**
   * Constructor for tweet by user id
   *
   * @param {object} params
   * @param {string} params.text
   * @param {string} params.userId
   *
   *
   * @constructor
   */

  constructor(params) {
    const oThis = this;

    oThis.text = params.text;
    oThis.userId = params.userId;

    oThis.secret = null;
    oThis.twitterUserExtendedObj = null;
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchTwitterUser();

    await oThis._checkIfUserActive();

    await oThis._fetchTwitterUserExtended();

    return oThis._tweetThankYouMessage();
  }

  /**
   * Fetch Twitter User Obj if present.
   *
   * @sets oThis.twitterUserObj
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUser() {
    const oThis = this;

    logger.log('Start::Fetch Twitter User');

    const twitterUserCacheRsp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.userId]
    }).fetch();

    if (twitterUserCacheRsp.isFailure()) {
      return Promise.reject(twitterUserCacheRsp);
    }

    oThis.twitterUserObj = twitterUserCacheRsp.data[oThis.userId];

    logger.log('End::Fetch Twitter User');
    return responseHelper.successWithData({});
  }

  /**
   * Fetch Secure User Obj.
   *
   * @return {Promise<Result>}
   *
   * @private
   */
  async _checkIfUserActive() {
    const oThis = this;

    logger.log('Start::Fetching Secure User for Say Thank you');

    const userCacheResp = await new UserCache({ ids: [oThis.userId] }).fetch();

    if (userCacheResp.isFailure()) {
      return Promise.reject(userCacheResp);
    }

    let userObj = userCacheResp.data[oThis.userId];

    if (userObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_fsu_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }

    logger.log('End::Fetching Secure User for Say Thank you');

    return responseHelper.successWithData({});
  }

  /**
   * Fetch Twitter User Extended Obj if present.
   *
   * @sets oThis.twitterUserExtendedObj, oThis.secret
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUserExtended() {
    const oThis = this;

    const secureTwitterUserExtendedRes = await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserId: oThis.twitterUserObj.id
    }).fetch();

    if (secureTwitterUserExtendedRes.isFailure()) {
      return Promise.reject(secureTwitterUserExtendedRes);
    }

    oThis.twitterUserExtendedObj = secureTwitterUserExtendedRes.data;

    if (
      oThis.twitterUserExtendedObj.status !== twitterUserExtendedConstants.activeStatus ||
      oThis.twitterUserExtendedObj.accessType !== twitterUserExtendedConstants.writeAccessType
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_ftue_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }

    oThis.secret = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, oThis.twitterUserExtendedObj.secretLc);
  }

  /**
   * Tweet thank you message.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _tweetThankYouMessage() {
    const oThis = this;

    let tweetMessage = new TweetMessage({});

    let tweetRsp = await tweetMessage.tweet({
      tweetText: oThis.text,
      oAuthToken: oThis.twitterUserExtendedObj.token,
      oAuthTokenSecret: oThis.secret
    });

    if (tweetRsp.isFailure() && tweetRsp.apiErrorIdentifier === 'twitter_unauthorized') {
      return oThis._invalidateTwitterCredentials();
    } else if (tweetRsp.isFailure()) {
      return Promise.reject(tweetRsp);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Invalidate twitter credentials
   *
   * @returns {Promise<void>}
   * @private
   */
  async _invalidateTwitterCredentials() {
    const oThis = this;

    logger.log('Start::Update Twitter User Extended for say thank you', oThis.twitterUserObj);

    await new TwitterUserExtendedModel()
      .update({
        access_type: twitterUserExtendedConstants.invertedAccessTypes[twitterUserExtendedConstants.noneAccessType],
        status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.expiredStatus]
      })
      .where({ id: oThis.twitterUserExtendedObj.id })
      .fire();

    await TwitterUserExtendedModel.flushCache({
      id: oThis.twitterUserExtendedObj.id,
      twitterUserId: oThis.twitterUserObj.id
    });

    logger.log('End::Update Twitter User Extended for say thank you', oThis.twitterUserObj);

    return responseHelper.successWithData({});
  }
}

module.exports = TweetByUserId;

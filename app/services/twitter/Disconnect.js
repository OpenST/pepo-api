const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended');

class TwitterDisconnect extends ServiceBase {
  /**
   * Constructor for TwitterDisconnect service.
   *
   * @param {object} params
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUserId = params.current_user.id;
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._getTwitterUserId();

    await oThis._markTokenNull();

    await oThis._rotateCookieToken();

    return responseHelper.successWithData({});
  }

  /**
   * Get twitter user id.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTwitterUserId() {
    const oThis = this;

    const twitterUserCacheRsp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.currentUserId]
    }).fetch();

    if (twitterUserCacheRsp.isFailure()) {
      return Promise.reject(twitterUserCacheRsp);
    }

    oThis.twitterUserId = twitterUserCacheRsp.data[oThis.currentUserId].id;
  }

  /**
   * Mark token and secret null in twitter users extended.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markTokenNull() {
    const oThis = this;

    await new TwitterUserExtendedModel()
      .update({
        token: null,
        status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.expiredStatus]
      })
      .where({ twitter_user_id: oThis.twitterUserId })
      .fire();

    await TwitterUserExtendedModel.flushCache({
      twitterUserId: oThis.twitterUserId
    });
  }

  /**
   * Rotate cookie token.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _rotateCookieToken() {
    const oThis = this;

    const cacheResponse = await new SecureUserCache({ id: oThis.currentUserId }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const secureCacheData = cacheResponse.data || {};

    oThis.decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, secureCacheData.encryptionSaltLc);
    const cookieToken = localCipher.generateRandomIv(32);
    oThis.encryptedCookieToken = localCipher.encrypt(oThis.decryptedEncryptionSalt, cookieToken);

    logger.log('oThis.decryptedEncryptionSalt', oThis.decryptedEncryptionSalt);
    logger.log('cookieToken', cookieToken);
    logger.log('oThis.encryptedCookieToken', oThis.encryptedCookieToken);

    await new UserModel()
      .update({
        cookie_token: oThis.encryptedCookieToken
      })
      .where({ id: oThis.currentUserId })
      .fire();

    // Clear secure user cache.
    await new SecureUserCache({ id: oThis.currentUserId }).clear();
  }
}

module.exports = TwitterDisconnect;

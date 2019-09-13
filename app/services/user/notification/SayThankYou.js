const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  TweetMessage = require(rootPrefix + '/lib/twitter/oAuth1.0/Tweet'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for thank you notification.
 *
 * @class SayThankYou
 */
class SayThankYou extends ServiceBase {
  /**
   * Constructor for thank you notification.
   *
   * @param {object} params
   * @param {string} params.text
   * @param {string} params.notification_id
   * @param {string} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.text = params.text;
    oThis.notificationId = params.notification_id;
    oThis.currentUserId = +params.current_user.id;
    oThis.tweetNeeded = +params.tweet_needed;

    oThis.secret = null;
    oThis.decryptedEncryptionSalt = null;
    oThis.twitterUserObj = null;
    oThis.twitterUserExtendedObj = null;
    oThis.userNotificationObj = {};
    oThis.decryptedNotificationParams = {};
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis.validateAndSanitize();

    await oThis._fetchAndValidateUserNotification();

    await oThis._updateUserNotification();

    await oThis._enqueueUserNotification();

    if (oThis.tweetNeeded) {
      await oThis._fetchTwitterUser();

      await oThis._fetchSecureUser();

      await oThis._fetchTwitterUserExtended();

      return oThis._tweetThankYouMessage();
    }

    return responseHelper.successWithData({ refreshCurrentUser: false });
  }

  /**
   * Validate and sanitize params.
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;

    await oThis._decryptNotificationId();

    if (oThis.decryptedNotificationParams.user_id !== oThis.currentUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_notification_id'],
          debug_options: {
            decryptedNotificationParams: oThis.decryptedNotificationParams,
            currentUserId: oThis.currentUserId
          }
        })
      );
    }

    await oThis._validateText();
  }

  /**
   * Decrypt notification id.
   *
   * @sets oThis.decryptedNotificationParams
   *
   * @returns {Promise<*>}
   * @private
   */
  async _decryptNotificationId() {
    const oThis = this;
    try {
      oThis.decryptedNotificationParams = JSON.parse(base64Helper.decode(oThis.notificationId));
    } catch (error) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_5',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_notification_id'],
          debug_options: {
            error: error,
            notificationId: oThis.notificationId
          }
        })
      );
    }
  }

  /**
   * Validate text.
   *
   * @sets oThis.text
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateText() {
    const oThis = this;

    oThis.text = CommonValidators.sanitizeText(oThis.text);

    if (!CommonValidators.validateMaxLengthMediumString(oThis.text) || oThis.text.length === 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_text'],
          debug_options: { text: oThis.text }
        })
      );
    }
  }

  /**
   * Fetch and validate user notification.
   *
   * @sets oThis.userNotificationObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndValidateUserNotification() {
    const oThis = this;

    oThis.userNotificationObj = await new UserNotificationModel().fetchUserNotification(
      oThis.decryptedNotificationParams
    );

    if (!CommonValidators.validateNonEmptyObject(oThis.userNotificationObj)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_u_n_3',
          api_error_identifier: 'resource_not_found',
          debug_options: {
            reason: 'Invalid user notification obj.',
            userNotificationObj: oThis.userNotificationObj
          }
        })
      );
    }

    const thankYouFlag = oThis.userNotificationObj.thankYouFlag;
    if (thankYouFlag === 1) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_4',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_thank_you_flag'],
          debug_options: { thankYouFlag: thankYouFlag }
        })
      );
    }
  }

  /**
   * Update user notification.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserNotification() {
    const oThis = this;

    const queryParams = {
      thankYouFlag: 1,
      userId: oThis.userNotificationObj.userId,
      lastActionTimestamp: oThis.userNotificationObj.lastActionTimestamp,
      uuid: oThis.userNotificationObj.uuid,
      kind: oThis.userNotificationObj.kind
    };

    await new UserNotificationModel().updateThankYouFlag(queryParams);

    oThis.userNotificationObj.thankYouFlag = 1;

    await UserNotificationModel.flushCache(oThis.userNotificationObj);
  }

  /**
   * Enqueue user notification.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueUserNotification() {
    const oThis = this;

    // Notification would be published only if user is approved.
    await notificationJobEnqueue.enqueue(notificationJobConstants.contributionThanks, {
      userNotification: oThis.userNotificationObj,
      text: oThis.text
    });
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
      userIds: [oThis.currentUserId]
    }).fetch();

    if (twitterUserCacheRsp.isFailure()) {
      return Promise.reject(twitterUserCacheRsp);
    }

    oThis.twitterUserObj = twitterUserCacheRsp.data[oThis.currentUserId];

    logger.log('End::Fetch Twitter User');
    return responseHelper.successWithData({});
  }

  /**
   * Fetch Secure User Obj.
   *
   * @sets oThis.decryptedEncryptionSalt, oThis.encryptedSaltLc
   *
   * @return {Promise<Result>}
   *
   * @private
   */
  async _fetchSecureUser() {
    const oThis = this;

    logger.log('Start::Fetching Secure User for Say Thank you');

    const secureUserRes = await new SecureUserCache({ id: oThis.currentUserId }).fetch();

    if (secureUserRes.isFailure()) {
      return Promise.reject(secureUserRes);
    }

    let secureUserObj = secureUserRes.data;

    if (secureUserObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_fsu_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }

    oThis.decryptedEncryptionSalt = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, secureUserObj.encryptionSaltLc);

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

    if (tweetRsp.isFailure()) {
      return oThis._invalidateTwitterCredentials();
    }

    return responseHelper.successWithData({ refreshCurrentUser: false });
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
        status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.expiredStatus]
      })
      .where({ id: oThis.twitterUserExtendedObj.id })
      .fire();

    await TwitterUserExtendedModel.flushCache({
      id: oThis.twitterUserExtendedObj.id,
      twitterUserId: oThis.twitterUserObj.id
    });

    logger.log('End::Update Twitter User Extended for say thank you', oThis.twitterUserObj);

    return responseHelper.successWithData({
      refreshCurrentUser: true
    });
  }
}

module.exports = SayThankYou;

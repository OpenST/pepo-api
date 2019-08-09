const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  ContributionThanksPublisher = require(rootPrefix + '/lib/userNotificationPublisher/ContributionThanks'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
   * @param {string} params.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.text = +params.text;
    oThis.notificationId = +params.id;
    oThis.notificationId =
      'eyJ1c2VyX2lkIjoxLCJsYXN0X2FjdGlvbl90aW1lc3RhbXAiOjEyMzQ1NjcsInV1aWQiOiJjMzdkNjYxZC03ZTYxLTQ5ZWEtOTZhNS02OGMzNGU4M2RiM2EifQ==';
    oThis.userNotificationObj = {};
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    oThis._validateText(oThis.text);

    oThis._decryptNotificationId();

    await oThis._fetchAndValidateUserNotification();

    oThis._updateUserNotification();

    await oThis._enqueueUserNotification();

    // get user notification
    // update user notification
    // enqueue job with updated obj

    return oThis._fetchProfileDetails();
  }

  /**
   * Decrypt notification id.
   *
   * @return {any}
   */
  _decryptNotificationId() {
    const oThis = this;
    oThis.notificationId = JSON.parse(base64Helper.decode(oThis.notificationId));
  }

  /**
   * Validate text
   *
   * @param text
   * @private
   */
  _validateText(text) {
    const oThis = this;
    oThis.text = CommonValidators.sanitizeText(oThis.text);
    if (!CommonValidators.validateMaxLengthMediumString(oThis.text)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_1',
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
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndValidateUserNotification() {
    const oThis = this;
    oThis.userNotificationObj = await new UserNotificationModel().fetchByUuid(oThis.notificationId.uuid);
    let thankYouFlag = oThis.userNotificationObj.thankYouFlag;
    if (thankYouFlag === 1) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_2',
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
   * @private
   */
  _updateUserNotification() {
    const oThis = this;
    oThis.userNotificationObj.thankYouFlag = 1;
  }

  /**
   * Enqueue user notification.
   *
   * @private
   */
  async _enqueueUserNotification() {
    const oThis = this;
    let params = {
      userNotification: oThis.userNotificationObj,
      text: oThis.text
    };
    await new ContributionThanksPublisher(params).perform();
  }

  /**
   * Fetch profile details.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileDetails() {
    const oThis = this;

    const getProfileObj = new GetProfile({ userIds: [oThis.profileUserId], currentUserId: oThis.currentUserId });

    const response = await getProfileObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    const profileResp = response.data;

    return responseHelper.successWithData({
      userProfile: profileResp.userProfilesMap[oThis.profileUserId],
      userProfileAllowedActions: profileResp.userProfileAllowedActions[oThis.profileUserId],
      usersByIdMap: profileResp.usersByIdMap,
      tokenUsersByUserIdMap: profileResp.tokenUsersByUserIdMap,
      imageMap: profileResp.imageMap,
      videoMap: profileResp.videoMap,
      linkMap: profileResp.linkMap,
      tags: profileResp.tags,
      userStat: profileResp.userStat,
      videoDetailsMap: profileResp.videoDetailsMap,
      currentUserUserContributionsMap: profileResp.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: profileResp.currentUserVideoContributionsMap,
      pricePointsMap: profileResp.pricePointsMap
    });
  }
}

module.exports = SayThankYou;

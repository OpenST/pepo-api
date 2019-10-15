const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  slackWrapper = require(rootPrefix + '/lib/slack/wrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack');

/**
 * Class for after redemption job.
 *
 * @class AfterRedemptionJob
 */
class AfterRedemptionJob {
  /**
   * Constructor for after redemption job.
   *
   * @param {object} params
   * @param {object} params.transactionalMailParams
   * @param {number} params.currentUserId
   * @param {string} params.productKind
   * @param {number} params.newRequest
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.transactionalMailParams = params.transactionalMailParams;
    oThis.currentUserId = params.currentUserId;
    oThis.productKind = params.productKind;
    oThis.newRequest = params.newRequest;

    oThis.userData = null;
    oThis.tokenUser = null;
    oThis.twitterUserObj = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const promisesArray = [oThis._fetchUser(), oThis._fetchTokenUser(), oThis._fetchTwitterUser(), oThis._sendEmail()];
    await Promise.all(promisesArray);

    await oThis._sendSlackMessage();
  }

  /**
   * Fetch user.
   *
   * @sets oThis.userData
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUser() {
    const oThis = this;

    const cacheResponse = await new SecureUserCache({ id: oThis.currentUserId }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.userData = cacheResponse.data || {};
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.tokenUser
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.currentUserId] }).fetch();
    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUser = tokenUserRes.data[oThis.currentUserId];
  }

  /**
   * Fetch twitter user.
   *
   * @sets oThis.twitterUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTwitterUser() {
    const oThis = this;

    const twitterUserByUserIdsCacheResp = await new TwitterUserByUserIdsCache({
      userIds: [oThis.currentUserId]
    }).fetch();

    if (twitterUserByUserIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResp);
    }

    const twitterUserByUserIdObj = twitterUserByUserIdsCacheResp.data[oThis.currentUserId];
    if (!twitterUserByUserIdObj.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_b__arj_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: { userId: oThis.currentUserId }
        })
      );
    }

    // Should always be present.
    const twitterUserId = twitterUserByUserIdObj.id;

    const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: [twitterUserId]
    }).fetch();
    if (twitterUserByIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByIdsCacheResp);
    }

    oThis.twitterUserObj = twitterUserByIdsCacheResp.data[twitterUserId];
  }

  /**
   * Generate message.
   *
   * @returns {string}
   * @private
   */
  _generateMessage() {
    const oThis = this;

    const profileUrl = basicHelper.userProfilePrefixUrl() + '/' + oThis.currentUserId;
    let message = null;

    if (oThis.newRequest == 0) {
      message = `*Hi, We have a new Redemption Request from to be deprecated flow : *\n
      *User’s Name*: ${oThis.userData.name}\n
      *Username*: ${oThis.userData.userName}\n
      *Email address*: ${oThis.userData.email}\n
      *Gift Card Details*: ${oThis.productKind}\n
      *Profile URL*: ${profileUrl}\n
      *Token Holder Address*: ${oThis.tokenUser.ostTokenHolderAddress}\n
      *Twitter Handle*: ${oThis.twitterUserObj.handle}`;
    } else {
      message = `*Hi, We have a new Redemption Request : *\n
      *User’s Name*: ${oThis.userData.name}\n
      *Username*: ${oThis.userData.userName}\n
      *Email address*: ${oThis.userData.email}\n
      *Gift Card Details*: ${oThis.productKind}\n
      *Profile URL*: ${profileUrl}\n
      *Token Holder Address*: ${oThis.tokenUser.ostTokenHolderAddress}\n
      *Twitter Handle*: ${oThis.twitterUserObj.handle}\n
      *Dollar Amount*: ${oThis.transactionalMailParams.dollar_amount}\n
      *Unicorns Deducted*: ${oThis.transactionalMailParams.pepocorn_amount}\n
      *Redemption Id*: ${oThis.transactionalMailParams.redemption_id}\n
      *Pepo Beneficiary Address*: ${oThis.transactionalMailParams.pepo_beneficiary_address}`;
    }

    return message;
  }

  /**
   * Send email for initiation of redemption request.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendEmail() {
    const oThis = this;

    return new SendTransactionalMail(oThis.transactionalMailParams).perform();
  }

  /**
   * Send slack message.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendSlackMessage() {
    const oThis = this;

    const slackMessageParams = {
      channel: slackConstants.redemptionRequestChannelName,
      text: oThis._generateMessage()
    };

    return slackWrapper.sendMessage(slackMessageParams);
  }
}

module.exports = AfterRedemptionJob;

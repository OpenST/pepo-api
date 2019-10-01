const rootPrefix = '../../..',
  slackWrapper = require(rootPrefix + '/lib/slack/wrapper'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds');

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
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.transactionalMailParams = params.transactionalMailParams;
    oThis.currentUserId = params.currentUserId;
    oThis.productKind = params.productKind;

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

    const promisesArray = [];

    promisesArray.push(oThis._validateAndSanitize());
    promisesArray.push(oThis._fetchUser());
    promisesArray.push(oThis._fetchTokenUser());
    promisesArray.push(oThis._fetchTwitterUser());
    await Promise.all(promisesArray);

    oThis._prepareSlackMessageParams();

    promisesArray.push(oThis._sendEmail());
    promisesArray.push(oThis._sendSlackMessage());

    await Promise.all(promisesArray);
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    // Nothing to do.
  }

  async _fetchUser() {
    const oThis = this;
    const cacheResponse = await new SecureUserCache({ id: oThis.currentUserId }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.userData = cacheResponse.data || {};
  }

  /**
   * Fetch Token user
   *
   * @sets oThis.tokenUser
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('fetch Token User');

    let tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.currentUserId] }).fetch();

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
   * @return {Promise<void>}
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
    let twitterUserId = twitterUserByUserIdObj.id;

    const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: [twitterUserId]
    }).fetch();
    if (twitterUserByIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByIdsCacheResp);
    }

    oThis.twitterUserObj = twitterUserByIdsCacheResp.data[twitterUserId];
  }

  /**
   * Generate message
   *
   * @returns {string}
   * @private
   */
  _generateMessage() {
    const oThis = this;

    let profileUrl = s3Constants.convertToLongUrl(oThis.twitterUserObj.profileImageUrl);

    let message = `*Hi, We have a new Redemption Request*\n
      *User’s Name*: ${oThis.userData.name}\n
      *Username*: ${oThis.userData.userName}\n
      *Email address*: ${oThis.userData.email}\n
      *Gift Card Details*: ${oThis.productKind}\n
      *Profile URL*: ${profileUrl}\n
      *Token Holder Address*: ${oThis.tokenUser.ostTokenHolderAddress}\n
      *Twitter Handle*: ${oThis.twitterUserObj.handle}`;

    return message;
  }

  /**
   * Prepare slack message params
   *
   * sets oThis.slackMessageParams
   * @private
   */
  _prepareSlackMessageParams() {
    const oThis = this;

    oThis.slackMessageParams = {
      channel: slackConstants.redemptionRequestChannelName,
      text: oThis._generateMessage()
    };
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

    return slackWrapper.sendMessage(oThis.slackMessageParams);
  }
}

module.exports = AfterRedemptionJob;

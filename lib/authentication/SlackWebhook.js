const crypto = require('crypto');

const rootPrefix = '../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  AdminModel = require(rootPrefix + '/app/models/mysql/Admin'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  AdminByIdCache = require(rootPrefix + '/lib/cacheManagement/single/AdminById'),
  AdminBySlackIdCache = require(rootPrefix + '/lib/cacheManagement/single/AdminBySlackId'),
  slackConstants = require(rootPrefix + '/lib/globalConstant/slack'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class to validate webhooks received from Slack.
 *
 * @class AuthSlackWebhook
 */
class AuthSlackWebhook {
  /**
   * Constructor to validate webhooks received from Slack.
   *
   * @param {object} params
   * @param {string} params.rawBody
   * @param {object} params.requestHeaders
   * @param {object} params.webhookParams
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.rawBody = params.rawBody;
    oThis.requestHeaders = params.requestHeaders;
    oThis.webhookParams = params.webhookParams;

    oThis.webhookPayload = oThis.webhookParams.payload;

    oThis.currentAdmin = null;
  }

  /**
   * Perform.
   *
   * @return {Promise<*|result>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateRawBodyParams();

    await oThis._validateWebhookParams();

    await oThis._fetchAndValidateAdmin();

    await oThis._valiadateRequestHeaders();

    await oThis._validateSignature();

    return responseHelper.successWithData({ current_admin: oThis.currentAdmin });
  }

  /**
   * Validate raw body params.
   *
   * @return {Promise<*>}
   * @private
   */
  async _validateRawBodyParams() {
    const oThis = this;

    if (!CommonValidator.validateString(oThis.rawBody)) {
      return oThis._unauthorizedResponse('l_a_sw_vrbp_1');
    }
  }

  /**
   * Validate webhook params.
   *
   * @return {Promise<*>}
   * @private
   */
  async _validateWebhookParams() {
    const oThis = this;

    if (!CommonValidator.validateNonEmptyObject(oThis.webhookPayload)) {
      return oThis._unauthorizedResponse('l_a_sw_vwp_1');
    }

    if (!CommonValidator.validateNonEmptyObject(oThis.webhookPayload)) {
      return oThis._unauthorizedResponse('l_a_sw_vwp_2');
    }

    let domain = oThis.webhookPayload.team.domain,
      channelName = oThis.webhookPayload.channel.name,
      apiAppId = oThis.webhookPayload.api_app_id,
      isValidApiAppId = coreConstants.PEPO_SLACK_API_APP_ID === apiAppId,
      isValidChannelName =
        channelName === slackConstants.approveNewCreatorsChannelName ||
        channelName === slackConstants.contentMonitoringChannelName,
      isValidSlackDomain = domain === slackConstants.slackTeamDomain;

    if (!isValidApiAppId || !isValidChannelName || !isValidSlackDomain) {
      return oThis._unauthorizedResponse('l_a_sw_vwp_3');
    }
  }

  /**
   * Fetch and validate admin
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateAdmin() {
    const oThis = this,
      adminSlackId = oThis.webhookPayload.user.id;

    logger.log('Fetching admin.', adminSlackId);

    let adminBySlackIdCacheRsp = await new AdminBySlackIdCache({ slackId: adminSlackId }).fetch();

    if (
      adminBySlackIdCacheRsp.isFailure() ||
      !CommonValidators.validateNonEmptyObject(adminBySlackIdCacheRsp.data || !adminBySlackIdCacheRsp.data.id)
    ) {
      return oThis._unauthorizedResponse('l_a_sw_fava_1');
    }

    let adminId = adminBySlackIdCacheRsp.data.id;

    const cacheResponse = await new AdminByIdCache({ id: adminId }).fetch();
    if (cacheResponse.isFailure() || !CommonValidators.validateNonEmptyObject(cacheResponse.data)) {
      return oThis._unauthorizedResponse('l_a_sw_fava_2');
    }

    oThis.currentAdmin = new AdminModel().safeFormattedData(cacheResponse.data[adminId]);
  }

  /**
   * Validate request headers.
   *
   * @return {Promise<void>}
   * @private
   */
  async _valiadateRequestHeaders() {
    const oThis = this;

    let requestTimestamp = oThis.requestHeaders['x-slack-request-timestamp'],
      currentTimestamp = Math.floor(Date.now() / 1000),
      requestHeaderSignature = oThis.requestHeaders['x-slack-signature'],
      splittedRequestHeaderSignature = requestHeaderSignature.split('='),
      version = splittedRequestHeaderSignature[0],
      signature = splittedRequestHeaderSignature[1];

    if (!CommonValidator.validateNonEmptyObject(oThis.requestHeaders)) {
      return oThis._unauthorizedResponse('l_a_sw_vrh_1');
    }

    if (version !== 'v0') {
      return oThis._unauthorizedResponse('l_a_sw_vrh_2');
    }

    if (
      !CommonValidator.validateTimestamp(requestTimestamp) ||
      requestTimestamp > currentTimestamp ||
      requestTimestamp < currentTimestamp - slackConstants.eventExpiryTimestamp
    ) {
      return oThis._unauthorizedResponse('l_a_sw_vrh_3');
    }

    if (!CommonValidator.validateString(signature)) {
      return oThis._unauthorizedResponse('l_a_sw_vrh_4');
    }

    // TODO: check for characters allowed in signature
  }

  /**
   * Validate signature.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateSignature() {
    const oThis = this;

    let requestTimestamp = oThis.requestHeaders['x-slack-request-timestamp'],
      requestHeaderSignature = oThis.requestHeaders['x-slack-signature'],
      splittedRequestHeaderSignature = requestHeaderSignature.split('='),
      version = splittedRequestHeaderSignature[0],
      signature = splittedRequestHeaderSignature[1],
      slackSigningSeceret = coreConstants.PEPO_SLACK_SIGNING_SECRET;

    let signatureString = `${version}:${requestTimestamp}:${oThis.rawBody}`;
    const generatedSignature = crypto
      .createHmac('sha256', slackSigningSeceret)
      .update(signatureString)
      .digest('hex');

    if (generatedSignature !== signature) {
      return oThis._unauthorizedResponse('l_a_sw_vs_1');
    }
  }

  /**
   * Unauthorized response.
   *
   * @param {string} code
   *
   * @returns {Promise<never>}
   * @private
   */
  async _unauthorizedResponse(code) {
    const errorObj = responseHelper.error({
      internal_error_identifier: code,
      api_error_identifier: 'unauthorized_api_request'
    });

    await createErrorLogsEntry.perform(errorObj, errorLogsConstants.mediumSeverity);

    return Promise.reject(errorObj);
  }
}

module.exports = AuthSlackWebhook;

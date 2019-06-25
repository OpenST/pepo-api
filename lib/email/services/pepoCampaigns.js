const queryString = require('qs'),
  url = require('url');

const rootPrefix = '../../..',
  CreateSignature = require(rootPrefix + '/lib/email/services/createSignature'),
  httpWrapper = require(rootPrefix + '/lib/request/httpWrapper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  pepoCampaignsConstants = require(rootPrefix + '/lib/globalConstant/pepoCampaigns'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for pepo-campaigns sdk
 *
 * @class PepoCampaigns
 */
class PepoCampaigns {
  /**
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.apiEndpoint = coreConstants.PEPO_CAMPAIGN_BASE_URL.replace(/\/$/, ''); // removes trailing forward slash
    console.log('oThis.apiEndpoint----', oThis.apiEndpoint);
  }

  /**
   * Check if parameter is present.
   *
   * @param {String/Object} param: parameter value
   *
   * @public
   */
  isPresent(param) {
    return typeof param !== 'undefined' && param !== null && String(param).trim() !== '';
  }

  /**
   * Get formatted query params.
   *
   * @param {String} resource: API Resource
   * @param {Object} queryParams: resource query parameters
   *
   * @return {String}: query parameters with signature
   *
   * @private
   */
  _formatQueryParams(resource, queryParams) {
    const oThis = this;

    const signatureResult = CreateSignature.baseParams(resource);

    queryParams['api-key'] = coreConstants.PEPO_CAMPAIGN_CLIENT_KEY;
    queryParams.signature = signatureResult.signature;
    queryParams['request-time'] = signatureResult.requestTime;

    return oThis.formatQueryParams(queryParams);
  }

  /**
   * Format query params.
   *
   * @param {Object} queryParams: query params
   *
   * @private
   */
  formatQueryParams(queryParams) {
    return queryString
      .stringify(queryParams, {
        arrayFormat: 'brackets',
        sort: function(a, b) {
          return a.localeCompare(b);
        }
      })
      .replace(/%20/g, '+');
  }

  /**
   * Fetch Users Info
   *
   * @param emails
   * @returns {Promise<void>}
   */
  async fetchUsersInfo(emails) {
    const oThis = this;

    let requestPath = `/api/${pepoCampaignsConstants.pepoCampaignsAPIVersion}/user/info/`,
      requestUrl = `${oThis.apiEndpoint}${requestPath}`,
      requestParams = {
        emails: emails.join(',')
      };

    let requestData = oThis._formatQueryParams(requestPath, requestParams);

    await httpWrapper.makeGetRequest(requestUrl, requestData);
  }

  /**
   * Send Transactional Email
   *
   * @param email
   * @param template
   * @param emailVars
   * @returns {Promise<void>}
   */
  async sendTransactionalMail(email, template, emailVars) {
    const oThis = this;

    let endpoint = `/api/${pepoCampaignsConstants.pepoCampaignsAPIVersion}/send/`,
      requestUrl = `${oThis.apiEndpoint}`,
      requestParams = {
        email: email,
        template: template,
        email_vars: emailVars
      };

    await httpWrapper.makePostRequest(requestUrl, requestParams);
  }
}

module.exports = new PepoCampaigns();

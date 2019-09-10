const queryString = require('qs'),
  urlParser = require('url');

const rootPrefix = '../../..',
  CreateSignature = require(rootPrefix + '/lib/email/services/createSignature'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
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
  }

  /**
   * Get parsed URL.
   *
   * @param {String} resource: API Resource
   *
   * @return {Object}: parsed url object
   *
   * @private
   */
  _parseURL(resource) {
    const oThis = this;

    return urlParser.parse(resource);
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

    const signatureResult = CreateSignature.baseParams(resource, queryParams);

    queryParams['api-key'] = coreConstants.PEPO_CAMPAIGN_CLIENT_KEY;
    queryParams.signature = signatureResult.signature;
    queryParams['request-time'] = signatureResult.requestTime;

    return queryParams;
  }

  /**
   * Fetch Users Info
   *
   * @param emails
   * @returns {Promise<void>}
   */
  async fetchUsersInfo(emails) {
    const oThis = this;

    let endpoint = `/api/${pepoCampaignsConstants.pepoCampaignsAPIVersion}/user/info/`,
      requestParams = {
        emails: emails.join(',')
      };

    return oThis.makeRequest('GET', endpoint, requestParams);
  }

  /**
   * Send transactional email.
   *
   * @param email
   * @param template
   * @param emailVars
   * @returns {Promise<void>}
   */
  async sendTransactionalMail(email, template, emailVars) {
    const oThis = this;

    let endpoint = `/api/${pepoCampaignsConstants.pepoCampaignsAPIVersion}/send/`,
      requestParams = {
        email: email,
        template: template,
        email_vars: JSON.stringify(emailVars)
      };

    return oThis.makeRequest('POST', endpoint, requestParams);
  }

  /**
   * Add contact.
   *
   * @param listId
   * @param email
   * @param attributes
   * @param userStatus
   * @returns {Promise<void>}
   */
  async addContact(listId, email, attributes, userStatus) {
    const oThis = this;
    const endpoint = `/api/${pepoCampaignsConstants.pepoCampaignsAPIVersion}/list/${listId}/add-contact/`,
      requestParams = {
        email: email,
        attributes: attributes,
        user_status: userStatus
      };

    return oThis.makeRequest('POST', endpoint, requestParams);
  }

  /**
   * Add contact.
   *
   * @param requestType
   * @param endpoint
   * @param requestParams
   *
   * @returns {Promise<void>}
   */
  async makeRequest(requestType, endpoint, requestParams) {
    const oThis = this,
      requestUrl = `${oThis.apiEndpoint}${endpoint}`;

    let requestData = oThis._formatQueryParams(endpoint, requestParams);

    let HttpLibObj = new HttpLibrary({ resource: requestUrl }),
      responseData = null;

    if (requestType == 'GET') {
      responseData = await HttpLibObj.get(requestData).catch(function(err) {
        return err;
      });
    } else if (requestType == 'POST') {
      responseData = await HttpLibObj.post(requestData).catch(function(err) {
        return err;
      });
    }

    let res = JSON.parse(responseData.data.responseData);

    if (res.error) {
      return Promise.reject(res);
    }

    return responseHelper.successWithData({});
  }
}

module.exports = new PepoCampaigns();

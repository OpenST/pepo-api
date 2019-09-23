const urlParser = require('url');

const rootPrefix = '../../..',
  CreateSignature = require(rootPrefix + '/lib/email/services/createSignature'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  pepoCampaignsConstants = require(rootPrefix + '/lib/globalConstant/pepoCampaigns'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for pepo-campaigns sdk.
 *
 * @class PepoCampaigns
 */
class PepoCampaigns {
  /**
   * Constructor for pepo-campaigns sdk.
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.apiEndpoint = coreConstants.PEPO_CAMPAIGN_BASE_URL.replace(/\/$/, '');
    // Removes trailing forward slash
  }

  /**
   * Get parsed URL.
   *
   * @param {string} resource: API Resource
   *
   * @returns {object}: parsed url object
   * @private
   */
  _parseURL(resource) {
    return urlParser.parse(resource);
  }

  /**
   * Check if parameter is present.
   *
   * @param {string} param: parameter value
   *
   * @public
   */
  isPresent(param) {
    return typeof param !== 'undefined' && param !== null && String(param).trim() !== '';
  }

  /**
   * Get formatted query params.
   *
   * @param {string} resource: API Resource
   * @param {object} queryParams: resource query parameters
   *
   * @returns {string}: query parameters with signature
   * @private
   */
  _formatQueryParams(resource, queryParams) {
    const signatureResult = CreateSignature.baseParams(resource, queryParams);

    queryParams['api-key'] = coreConstants.PEPO_CAMPAIGN_CLIENT_KEY;
    queryParams.signature = signatureResult.signature;
    queryParams['request-time'] = signatureResult.requestTime;

    return queryParams;
  }

  /**
   * Fetch users info.
   *
   * @param {array} emails
   *
   * @returns {Promise<void>}
   */
  async fetchUsersInfo(emails) {
    const oThis = this;

    const endpoint = `/api/${pepoCampaignsConstants.pepoCampaignsAPIVersion}/user/info/`,
      requestParams = {
        emails: emails.join(',')
      };

    return oThis.makeRequest('GET', endpoint, requestParams);
  }

  /**
   * Send transactional email.
   *
   * @param {string} email
   * @param {string} template
   * @param {object} emailVars
   *
   * @returns {Promise<void>}
   */
  async sendTransactionalMail(email, template, emailVars) {
    const oThis = this;

    const endpoint = `/api/${pepoCampaignsConstants.pepoCampaignsAPIVersion}/send/`,
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
   * @param {string/number} listId
   * @param {string} email
   * @param {object} attributes
   * @param {string} userStatus
   *
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
   * @param {string} requestType
   * @param {string} endpoint
   * @param {object} requestParams
   *
   * @returns {Promise<void>}
   */
  async makeRequest(requestType, endpoint, requestParams) {
    const oThis = this,
      requestUrl = `${oThis.apiEndpoint}${endpoint}`;

    const requestData = oThis._formatQueryParams(endpoint, requestParams);

    const HttpLibObj = new HttpLibrary({ resource: requestUrl });
    let responseData = null;

    if (requestType === 'GET') {
      responseData = await HttpLibObj.get(requestData).catch(function(err) {
        return err;
      });
    } else if (requestType === 'POST') {
      responseData = await HttpLibObj.post(requestData).catch(function(err) {
        return err;
      });
    }

    const res = JSON.parse(responseData.data.responseData);

    if (res.error) {
      return Promise.reject(res);
    }

    return responseHelper.successWithData({});
  }
}

module.exports = new PepoCampaigns();

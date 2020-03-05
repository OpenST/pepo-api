const queryString = require('qs');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for web page constants.
 *
 * @class WebPageConstant
 */
class WebPageConstant {
  /**
   * Get opt in email.
   *
   * @returns {string}
   */
  get optInEmailLink() {
    const oThis = this;
    return coreConstants.PA_DOMAIN + oThis.doubleOptInWebPath;
  }

  get redemptionProductPagePath() {
    return '/redemptions/products';
  }

  get supportPagePath() {
    return '/support';
  }

  get sessionAuthPagePath() {
    return '/session-auth';
  }

  get ostTransactionsPagePath() {
    return '/ost-transactions';
  }

  /**
   * Get double opt in web path.
   *
   * @returns {string}
   */
  get doubleOptInWebPath() {
    return '/doptin';
  }

  /**
   * redemption product link
   *
   * @return {string}
   */
  get redemptionProductLink() {
    const oThis = this;

    return coreConstants.PA_WEB_DOMAIN + oThis.redemptionProductPagePath;
  }

  /**
   * redemption web view product link
   *
   * @return {string}
   */
  get redemptionWebViewProductLink() {
    const oThis = this;

    return coreConstants.PA_STORE_WEB_DOMAIN;
  }

  /**
   * redemption product link
   *
   * @return {string}
   */
  get supportLink() {
    const oThis = this;

    return coreConstants.PA_WEB_DOMAIN + oThis.supportPagePath;
  }

  /**
   * session Auth link
   *
   * @return {string}
   */
  _sessionAuthLink(sessionAuthPayloadId) {
    const oThis = this;

    return coreConstants.PA_WEB_DOMAIN + oThis.sessionAuthPagePath + `/${sessionAuthPayloadId}`;
  }

  /**
   * Generate redemption url.
   *
   * @param params
   *
   * @returns {string}
   * @private
   */
  _generateRedemptionUrl(params) {
    const oThis = this;

    let qsParamsString = queryString
      .stringify(params.options, {
        arrayFormat: 'brackets',
        sort: function(elementOne, elementTwo) {
          return elementOne.localeCompare(elementTwo);
        }
      })
      .replace(/%20/g, '+');

    return `${params.url}?rt=${params.urlToken}&${qsParamsString}`;
  }
}

module.exports = new WebPageConstant();

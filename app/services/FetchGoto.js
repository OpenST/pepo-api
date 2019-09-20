const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity'),
  commonValidators = require(rootPrefix + '/lib/validators/Common'),
  pageNameConstants = require(rootPrefix + '/lib/globalConstant/pageName'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const currentPepoApiDomain = coreConstants.PA_DOMAIN;
const urlParser = require('url');

class FetchGoto extends ServiceBase {
  /**
   * Constructor for FetchGoto service.
   *
   * @param {object} params
   * @param {object} [params.url]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.url = params.url.toLowerCase();
    oThis.parsedUrl = {};
    oThis.gotoKind = null;
    oThis.gotoParams = null;
  }

  /**
   * Perform: Perform for fetch goto.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    oThis.parsedUrl = urlParser.parse(oThis.url, true);
    if (!commonValidators.validateNonEmptyObject(oThis.parsedUrl)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_fgt_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: [],
          debug_options: {
            url: oThis.url
          }
        })
      );
    }

    await oThis._validateUrl();

    oThis._fetchGotoKindAndParams();
  }

  async _validateUrl() {
    const oThis = this;

    // Protocol and host are unknown
    if (!['http:', 'https:'].includes(oThis.parsedUrl.protocol) || !oThis.parsedUrl.host.match(currentPepoApiDomain)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_fgt_2',
          api_error_identifier: 'NOT_FOUND',
          debug_options: {
            url: oThis.url
          }
        })
      );
    }
  }

  /**
   * Url Handler.
   *
   * @returns {*}
   * @private
   */
  _fetchGotoKindAndParams() {
    const oThis = this;

    let pathName = oThis.parsedUrl.pathname;

    // If url is of video
    if (pathName.match(gotoConstants.videoGotoKind)) {
      oThis.gotoParams = { videoId: pathName.split('/')[2] };
      oThis.gotoKind = oThis.videoGotoKind;
    } else if (pathName == '/') {
      // Only pepo.com is shared, look for invite code if present
      let queryParams = oThis.parsedUrl.query;
      if (queryParams && queryParams['invite']) {
        oThis.gotoParams = { inviteCode: queryParams['invite'] };
        oThis.gotoKind = oThis.signupGotoKind;
      }
    }
  }

  /**
   * Prepare Response.
   *
   * @returns {{}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return {
      [entityType.goto]: oThis.goto
    };
  }
}

module.exports = FetchGoto;

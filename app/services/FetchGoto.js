const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity'),
  commonValidators = require(rootPrefix + '/lib/validators/Common'),
  pageNameConstants = require(rootPrefix + '/lib/globalConstant/pageName'),
  gotoFactory = require(rootPrefix + '/lib/goTo/factory'),
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
   * Main performer
   *
   * @returns {Promise<*>}
   * @private
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

    return oThis._prepareResponse();
  }

  /**
   * Validate url
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateUrl() {
    const oThis = this;

    // Protocol and host are unknown
    if (
      !commonValidators.validateNonEmptyObject(oThis.parsedUrl) ||
      !['http:', 'https:'].includes(oThis.parsedUrl.protocol) ||
      !currentPepoApiDomain.match(oThis.parsedUrl.host)
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_fgt_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            url: oThis.url
          }
        })
      );
    }
  }

  /**
   * Fetch Goto kind and params from url
   *
   * @private
   */
  _fetchGotoKindAndParams() {
    const oThis = this;

    let pathName = oThis.parsedUrl.pathname,
      query = oThis.parsedUrl.query;
    if (pathName.match(gotoConstants.videoGotoKind)) {
      oThis.gotoParams = { videoId: pathName.split('/')[2] };
      oThis.gotoKind = gotoConstants.videoGotoKind;
    } else if (pathName == '/terms' || pathName == '/privacy') {
      oThis.gotoKind = gotoConstants.webViewGotoKind;
      oThis.gotoParams = { url: oThis.url };
    } else if (pathName == '/account') {
      oThis.gotoKind = gotoConstants.invitedUsersGotoKind;
    } else if (pathName == '/' && query && query['invite']) {
      oThis.gotoParams = { inviteCode: query['invite'] };
      oThis.gotoKind = gotoConstants.signUpGotoKind;
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

    if (oThis.gotoKind) {
      let goto = gotoFactory.gotoFor(oThis.gotoKind, oThis.gotoParams);
      return responseHelper.successWithData({
        [entityType.goto]: goto
      });
    } else {
      return responseHelper.error({
        internal_error_identifier: 'a_s_fgt_4',
        api_error_identifier: 'entity_not_found',
        debug_options: {
          url: oThis.url
        }
      });
    }
  }
}

module.exports = FetchGoto;

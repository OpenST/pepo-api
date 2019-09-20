const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity'),
  commonValidators = require(rootPrefix + '/lib/validators/Common'),
  pageNameConstants = require(rootPrefix + '/lib/globalConstant/pageName'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const currentPepoApiDomain = 'stagingpepo.com'; //coreConstants.PA_DOMAIN;
const urlParser = require('url');

class FetchGoto extends ServiceBase {
  /**
   * Constructor for FetchGoto service.
   *
   * @param {object} params
   * @param {object} [params.url]
   * @param {object} [params.gotoKind]
   * @param {object} [params.gotoValue]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.url = params.url;
    oThis.inputGotoKind = params.gotoKind;
    oThis.inputGotoValue = params.gotoValue;

    oThis.gotoValues = {};
    oThis.goto = null;
    oThis.parsedUrl = {};
  }

  /**
   * Perform: Perform for fetch goto.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    if (oThis.url) {
      await oThis._fetchGotoByUrl();
    } else if (oThis.inputGotoKind) {
      await oThis._fetchGotoByGotoKind();
    } else {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_fgt_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: [],
          debug_options: {
            url: oThis.url,
            inputGotoKind: oThis.inputGotoKind
          }
        })
      );
    }

    oThis._fetchGotoFromConfig();

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch goto by input url.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchGotoByUrl() {
    const oThis = this;

    oThis.url = oThis.url.toLowerCase();

    await oThis._fetchAndValidateUrlDomain();

    let urlHandlerResponse = oThis._urlHandler();
    if (urlHandlerResponse.isFailure()) {
      return Promise.reject(urlHandlerResponse);
    }

    oThis.gotoValues = {
      gotoKind: urlHandlerResponse.data.gotoKind,
      gotoData: urlHandlerResponse.data.gotoData
    };
  }

  /**
   * Fetch goto by goto kinds.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchGotoByGotoKind() {
    const oThis = this;

    if (!Object.keys(gotoConstants.invertedGotoKinds).includes(oThis.inputGotoKind)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_fgt_2',
          api_error_identifier: 'resource_not_found',
          debug_options: {
            inputGotoKind: oThis.inputGotoKind
          }
        })
      );
    }

    oThis.gotoValues = {
      gotoKind: oThis.inputGotoKind,
      gotoData: oThis.inputGotoValue
    };
  }

  /**
   * Fetch and validate url domain.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateUrlDomain() {
    const oThis = this;

    oThis.parsedUrl = urlParser.parse(oThis.url, true);

    // If url is not correct or protocol is invalid or host is different from current domain
    if (
      !commonValidators.validateNonEmptyObject(oThis.parsedUrl) ||
      !['http:', 'https:'].includes(oThis.parsedUrl.protocol) ||
      !oThis.parsedUrl.host.match(currentPepoApiDomain)
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_fgt_3',
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
  _urlHandler() {
    const oThis = this;

    let pathName = oThis.parsedUrl.pathname;

    // for now, this service only supports for video/:video_id route
    if (pathName.match(gotoConstants.videoShareGotoKind)) {
      let videoId = pathName.split('/')[2];
      return responseHelper.successWithData({
        gotoKind: gotoConstants.videoShareGotoKind,
        gotoData: videoId
      });
    } else {
      return responseHelper.error({
        internal_error_identifier: 'a_s_fgt_4',
        api_error_identifier: 'NOT_FOUND',
        debug_options: {
          url: oThis.url
        }
      });
    }
  }

  /**
   * Fetch goto for given kind.
   *
   * @private
   *
   * @sets oThis.goto
   */
  _fetchGotoFromConfig() {
    const oThis = this;

    let gotoConfig = {
      [gotoConstants.videoShareGotoKind]: {
        pn: pageNameConstants.videoPageName,
        v: {
          [pageNameConstants.videoIdParam]: oThis.gotoValues.gotoData
        }
      },
      [gotoConstants.addEmailScreenGotoKind]: {
        pn: pageNameConstants.addEmailScreen,
        v: {}
      }
    };

    oThis.goto = gotoConfig[oThis.gotoValues.gotoKind];
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

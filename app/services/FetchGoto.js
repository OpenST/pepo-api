const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  commonValidators = require(rootPrefix + '/lib/validators/Common'),
  pageNameConstant = require(rootPrefix + '/lib/globalConstant/pageName'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const currentPepoApiDomain = coreConstants.PA_DOMAIN;

class FetchGoto extends ServiceBase {
  /**
   * Constructor for FetchGoto service.
   *
   * @param {object} params
   * @param {object} params.url
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.url = params.url;

    oThis.goto = null;
  }

  /**
   * Perform: Perform for fetch goto.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndValidateUrlDomain();

    let urlHandlerResponse = oThis._urlHandler();

    if (urlHandlerResponse.isFailure()) {
      return Promise.reject(urlHandlerResponse);
    }

    oThis._fetchGoto(urlHandlerResponse.data.urlData);

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch and validate url domain.
   *
   * @returns {Promise<never>}
   * @private
   */
  _fetchAndValidateUrlDomain() {
    const oThis = this;

    if (commonValidators.isVarNullOrUndefined(oThis.url.match(currentPepoApiDomain))) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_fgt_2',
          api_error_identifier: 'resource_not_found',
          debug_options: {
            url: oThis.url,
            urlDomain: currentPepoApiDomain
          }
        })
      );
    }

    let inputUrlDomain = oThis.url.match(currentPepoApiDomain)[0];

    if (inputUrlDomain !== currentPepoApiDomain) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_fgt_3',
          api_error_identifier: 'resource_not_found',
          debug_options: {
            inputUrlDomain: inputUrlDomain,
            urlDomain: currentPepoApiDomain
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

    let splitUrlParts = oThis.url.split(currentPepoApiDomain),
      splittedPaths = splitUrlParts[1].split('/');

    let urlKind = splittedPaths[1],
      urlData = splittedPaths[2];

    // for now, this service only supports for video/:video_id route
    if (urlKind === 'video') {
      return responseHelper.successWithData({ urlKind: urlKind, urlData: urlData });
    } else {
      return responseHelper.error({
        internal_error_identifier: 'a_s_fgt_4',
        api_error_identifier: 'resource_not_found',
        debug_options: {
          url: oThis.url
        }
      });
    }
  }

  /**
   * Fetch go to.
   *
   * @private
   *
   * @sets oThis.goto
   */
  _fetchGoto(value) {
    const oThis = this;

    oThis.goto = {
      pn: pageNameConstant.videoPageName,
      v: {
        [pageNameConstant.videoIdParam]: value
      }
    };
  }

  _prepareResponse() {
    const oThis = this;

    return {
      [entityType.goto]: oThis.goto
    };
  }
}

module.exports = FetchGoto;

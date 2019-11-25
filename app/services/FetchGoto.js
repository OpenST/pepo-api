const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TagIdByNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/TagIdByNames'),
  commonValidators = require(rootPrefix + '/lib/validators/Common'),
  gotoFactory = require(rootPrefix + '/lib/goTo/factory'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userUtmDetailsConstants = require(rootPrefix + '/lib/globalConstant/userUtmDetail'),
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
    oThis.url = params.url.toLowerCase().replace(/&amp;/g, '&');
    oThis.parsedUrl = {};
    oThis.gotoKind = null;
    oThis.gotoParams = null;
    oThis.utmCookieValue = null;
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

    await oThis._fetchGotoKindAndParams();

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
  async _fetchGotoKindAndParams() {
    const oThis = this;

    let pathName = oThis.parsedUrl.pathname,
      pathArray = pathName.split('/'),
      query = oThis.parsedUrl.query;

    if (pathArray[1] == gotoConstants.videoGotoKind) {
      let videoId = Number(pathArray[2]);
      if (videoId) {
        oThis.gotoParams = { videoId: videoId };
        oThis.gotoKind = gotoConstants.videoGotoKind;
      }
    } else if (pathArray[1] == gotoConstants.tagGotoKind) {
      let tagName = pathArray[2];

      if (tagName) {
        const tagByTagNamesCacheRsp = await new TagIdByNamesCache({ names: [tagName] }).fetch(),
          tagByTagNamesCacheData = tagByTagNamesCacheRsp.data;

        if (commonValidators.validateInteger(tagByTagNamesCacheData[tagName])) {
          let tagId = tagByTagNamesCacheData[tagName];
          oThis.gotoKind = gotoConstants.tagGotoKind;
          oThis.gotoParams = { tagId: tagId };
        }
      }
    } else if (pathArray[1] == 'account') {
      oThis.gotoKind = gotoConstants.invitedUsersGotoKind;
    } else if (pathArray[1] == 'doptin') {
      // If url is doptin then send it to webview
      if (query && query['t']) {
        oThis.gotoParams = { url: oThis.url };
        oThis.gotoKind = gotoConstants.webViewGotoKind;
      }
    } else if (!pathArray[1]) {
      // If url is just 'pepo.com/' then look for invite code if any
      if (query && query['invite']) {
        oThis.gotoParams = { inviteCode: query['invite'] };
        oThis.gotoKind = gotoConstants.signUpGotoKind;
      }
      oThis.utmCookieValue = userUtmDetailsConstants.utmCookieToSet(query);
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
        [entityType.goto]: goto,
        utmCookieValue: oThis.utmCookieValue
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

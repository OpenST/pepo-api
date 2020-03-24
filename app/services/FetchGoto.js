const urlParser = require('url');

const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TagIdByNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/TagIdByNames'),
  UserByUsernameCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  gotoFactory = require(rootPrefix + '/lib/goTo/factory'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  webPageConstants = require(rootPrefix + '/lib/globalConstant/webPage'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  userUtmDetailsConstants = require(rootPrefix + '/lib/globalConstant/userUtmDetail');

// Declare variables.
const currentPepoApiDomain = coreConstants.PA_DOMAIN;

/**
 * Class to fetch goto.
 *
 * @class FetchGoto
 */
class FetchGoto extends ServiceBase {
  /**
   * Constructor to fetch goto.
   *
   * @param {object} params
   * @param {object} params.url
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.url = params.url.toLowerCase().replace(/&amp;/g, '&');

    oThis.parsedUrl = {};
    oThis.gotoKind = null;
    oThis.gotoParams = null;
    oThis.utmCookieValue = null;
  }

  /**
   * Async perform.
   *
   * @sets oThis.parsedUrl
   *
   * @returns {Promise<*>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    oThis.parsedUrl = urlParser.parse(oThis.url, true);

    if (!CommonValidators.validateNonEmptyObject(oThis.parsedUrl)) {
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
   * Validate url.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateUrl() {
    const oThis = this;

    // Protocol and host are unknown
    if (
      !CommonValidators.validateNonEmptyObject(oThis.parsedUrl) ||
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
   * Fetch goto kind and params from url.
   *
   * @sets oThis.gotoKind, oThis.gotoParams
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchGotoKindAndParams() {
    const oThis = this;

    const pathName = oThis.parsedUrl.pathname,
      pathArray = pathName.split('/'),
      query = oThis.parsedUrl.query;

    switch (pathArray[1]) {
      case webPageConstants.sessionAuthPagePath: {
        const sessionAuthPayloadId = Number(pathArray[2]);
        if (sessionAuthPayloadId) {
          oThis.gotoParams = { sessionAuthPayloadId: sessionAuthPayloadId };
          oThis.gotoKind = gotoConstants.sessionAuthGotoKind;
        }
        break;
      }
      case gotoConstants.videoGotoKind: {
        const videoId = Number(pathArray[2]);
        if (videoId) {
          oThis.gotoParams = { videoId: videoId };
          oThis.gotoKind = gotoConstants.videoGotoKind;
        }

        break;
      }
      case gotoConstants.replyGotoKind: {
        const replyDetailId = Number(pathArray[2]);

        if (replyDetailId) {
          const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [replyDetailId] }).fetch();
          if (replyDetailCacheResp.isFailure()) {
            return Promise.reject(replyDetailCacheResp);
          }

          const replyDetail = replyDetailCacheResp.data[replyDetailId];

          if (CommonValidators.validateNonEmptyObject(replyDetail)) {
            oThis.gotoParams = { replyDetailId: replyDetailId, parentVideoId: replyDetail.parentId };
            oThis.gotoKind = gotoConstants.replyGotoKind;
          }
        }

        break;
      }
      case gotoConstants.tagGotoKind: {
        let tagName = pathArray[2];
        if (tagName) {
          tagName = tagName.toLowerCase();
          const tagByTagNamesCacheRsp = await new TagIdByNamesCache({ names: [tagName] }).fetch(),
            tagByTagNamesCacheData = tagByTagNamesCacheRsp.data;

          if (CommonValidators.validateInteger(tagByTagNamesCacheData[tagName])) {
            const tagId = tagByTagNamesCacheData[tagName];
            oThis.gotoParams = { tagId: tagId };
            oThis.gotoKind = gotoConstants.tagGotoKind;
          }
        }

        break;
      }
      case gotoConstants.communitiesUrlKind: {
        let channelPermalink = pathArray[2];

        if (channelPermalink) {
          channelPermalink = channelPermalink.toLowerCase();
          const cacheResponse = await new ChannelByPermalinksCache({ permalinks: [channelPermalink] }).fetch();
          if (cacheResponse.isFailure()) {
            return Promise.reject(cacheResponse);
          }

          const channelId = (cacheResponse.data[channelPermalink] || {}).id;

          if (Number(channelId)) {
            // Channel is valid then look whether meeting is also passed in url
            // If meetings and meeting id is passed in url then send goto as webview
            if (pathArray[3] && pathArray[3] == 'meetings' && pathArray[4]) {
              oThis.gotoParams = { url: oThis.url };
              oThis.gotoKind = gotoConstants.webViewGotoKind;
            } else {
              oThis.gotoParams = { channelId: channelId };
              oThis.gotoKind = gotoConstants.channelsGotoKind;
            }
          }
        }

        break;
      }
      case 'account': {
        oThis.gotoKind = gotoConstants.invitedUsersGotoKind;

        break;
      }
      case 'feed': {
        oThis.gotoKind = gotoConstants.feedGotoKind;

        break;
      }
      case 'doptin': {
        // If url is doptin then send it to webview.
        if (query && query.t) {
          oThis.gotoParams = { url: oThis.url };
          oThis.gotoKind = gotoConstants.webViewGotoKind;
        }

        break;
      }
      default: {
        // Look if url includes username
        if (!pathArray[2] && CommonValidators.validateUserName(pathArray[1])) {
          // If anything is passed after first element, that means url is pepo.com/xyz/abc, then its not a profile url
          // If its a valid username, then look for existence in db
          const cacheResponse = await new UserByUsernameCache({ userNames: [pathArray[1]] }).fetch();
          if (cacheResponse.isFailure()) {
            return Promise.reject(cacheResponse);
          }
          const userObj = cacheResponse.data[pathArray[1]];

          if (CommonValidators.validateNonEmptyObject(userObj)) {
            oThis.gotoKind = gotoConstants.profileGotoKind;
            oThis.gotoParams = { userId: userObj.id };
            // If pay parameter is passed for profile page then pass that in params too.
            if (query && query.at == 'pay') {
              oThis.gotoParams.at = query.at;
            }
          }
        }
        break;
      }
    }

    if (!pathArray[1]) {
      // If url is just 'pepo.com/' then look for invite code if any.
      if (query && query.invite) {
        oThis.gotoParams = { inviteCode: query.invite };
        oThis.gotoKind = gotoConstants.signUpGotoKind;
      } else {
        oThis.gotoKind = gotoConstants.feedGotoKind;
      }
    }

    // Set UTM cookie if utm params are present in the query params.
    oThis.utmCookieValue = userUtmDetailsConstants.utmCookieToSet(query);
  }

  /**
   * Prepare response.
   *
   * @returns {{}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    if (oThis.gotoKind) {
      const goto = gotoFactory.gotoFor(oThis.gotoKind, oThis.gotoParams);

      return responseHelper.successWithData({
        [entityTypeConstants.goto]: goto,
        utmCookieValue: oThis.utmCookieValue
      });
    }

    return responseHelper.error({
      internal_error_identifier: 'a_s_fgt_4',
      api_error_identifier: 'entity_not_found',
      debug_options: {
        url: oThis.url
      }
    });
  }
}

module.exports = FetchGoto;

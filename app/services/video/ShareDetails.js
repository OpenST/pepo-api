const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  commonValidator = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

const urlDomain = coreConstants.PA_DOMAIN;

class ShareDetails extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = params.video_id;
    oThis.currentUser = params.current_user;

    oThis.videoLink = null;
    oThis.creatorUserId = null;
    oThis.shareMessage = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchVideo();
    await oThis._fetchVideoDetails();

    oThis._createMessage();

    return oThis._prepareResponse();
  }

  /**
   * Fetch video.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideo() {
    const oThis = this;

    const cacheRsp = await new VideoByIdCache({ ids: [oThis.videoId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    if (!commonValidator.validateNonEmptyObject(cacheRsp.data[oThis.videoId])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_sd_1',
          api_error_identifier: 'resource_not_found',
          debug_options: {
            inputVideoId: oThis.videoId
          }
        })
      );
    }

    let videoData = cacheRsp.data[oThis.videoId];

    oThis.videoLink = videoData.resolutions.original.url;
  }

  /**
   * Fetch video details.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideoDetails() {
    const oThis = this;

    const cacheRsp = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    let videoDetails = cacheRsp.data[oThis.videoId];

    oThis.creatorUserId = videoDetails.creatorUserId;
  }

  /**
   * Create Message.
   *
   * @private
   */
  _createMessage() {
    const oThis = this;

    let messagePrefix = 'Checkout this video ',
      messageSuffix = ' via @thepepoapp';

    if (oThis.currentUser === oThis.creatorUserId) {
      messagePrefix = 'Checkout my video ';
    }

    oThis.shareMessage = messagePrefix + oThis.videoLink + messageSuffix;
  }

  /**
   * Prepare final response.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityType.share]: {
        id: uuidV4(),
        kind: shareEntityConstants.videoShareKind,
        url: oThis._generateVideoShareUrl(),
        message: oThis.shareMessage,
        // title: 'DUMMY_TITLE', //optional
        // subject: 'DUMMY_SUBJECT', //optional
        uts: Math.round(new Date() / 1000)
      }
    });
  }

  /**
   * Generate video share url.
   *
   * @returns {string}
   * @private
   */
  _generateVideoShareUrl() {
    const oThis = this;

    return urlDomain + '/' + shareEntityConstants.videoShareKind + '/' + oThis.videoId;
  }
}

module.exports = ShareDetails;

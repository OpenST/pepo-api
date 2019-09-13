const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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

    let videoData = cacheRsp.data[oThis.videoId];

    oThis.videoLink = videoData.resolutions.original.url;
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

    if (oThis.currentUser) {
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

    let fetchGotoUrl = urlDomain + '/' + shareEntityConstants.videoShareKind + '/' + oThis.videoId;

    console.log('fetchGotoUrl------', fetchGotoUrl);
    console.log('oThis.shareMessage-----', oThis.shareMessage);

    return responseHelper.successWithData({
      [entityType.share]: {
        id: uuidV4(),
        kind: shareEntityConstants.videoShareKind,
        url: fetchGotoUrl,
        message: oThis.shareMessage,
        // title: 'DUMMY_TITLE', //optional
        // subject: 'DUMMY_SUBJECT', //optional
        uts: Math.round(new Date() / 1000)
      }
    });
  }
}

module.exports = ShareDetails;

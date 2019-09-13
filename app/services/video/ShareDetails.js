const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
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
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    oThis._createMessage();

    return oThis._prepareResponse();
  }

  _createMessage() {
    const oThis = this;
  }

  /**
   * Prepare final response.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    let videoUrl = urlDomain + '/video/1006';

    return responseHelper.successWithData({
      [entityType.share]: {
        id: uuidV4(),
        uts: Math.round(new Date() / 1000),
        url: videoUrl,
        kind: 'VIDEO',
        message: 'DUMMY_MESSAGE',
        title: 'DUMMY_TITLE',
        subject: 'DUMMY_SUBJECT'
      }
    });
  }
}

module.exports = ShareDetails;

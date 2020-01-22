const uuidV4 = require('uuid/v4');

const rootPrefix = '../../../..',
  VideoBase = require(rootPrefix + '/lib/jobs/webhookPreProcessor/video/Base'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Constructor for VideoUpdate.
 *
 * @class VideoUpdate
 */
class VideoUpdate extends VideoBase {
  /**
   * Constructor for VideoUpdate.
   *
   * @augments VideoUpdate
   * @param {object} params
   * @param {number} params.videoId
   * @param {number} params.newUpload
   * @param {array} params.oldTagIds
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;
    logger.log('VideoUpdate===========', params);

    oThis.newUpload = params.newUpload || 0;
    oThis.oldTagIds = params.oldTagIds || [];

    oThis.videoDetail = null;
    oThis.tagIds = oThis.oldTagIds;
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.feedObj
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    await super._validateAndSanitizeParams();
  }

  /**
   * Extra Data for event kind
   *
   * @returns {Object}
   * @private
   */
  _extraDataForWebhookEvent() {
    const oThis = this;

    return {
      videoId: oThis.videoId
    };
  }

  /**
   * Topic Kind
   *
   * @returns {string}
   * @private
   */
  _topicKind() {
    const oThis = this;

    return webhookEventConstants.videoUpdateTopicKind;
  }

  /**
   * Timestamp in Seconds for webhook event
   *
   * @returns {string}
   * @private
   */
  _executeAt() {
    const oThis = this;

    let executionTimestamp = Math.round(new Date() / 1000);

    if (oThis.newUpload) {
      executionTimestamp += 5 * 60;
    }

    return executionTimestamp;
  }
}

module.exports = VideoUpdate;

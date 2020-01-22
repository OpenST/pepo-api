const rootPrefix = '../../../..',
  VideoBase = require(rootPrefix + '/lib/jobs/webhookPreProcessor/video/Base'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent');

/**
 * Class for video update pre-processor.
 *
 * @class VideoUpdate
 */
class VideoUpdate extends VideoBase {
  /**
   * Constructor for video update pre-processor.
   *
   * @param {object} params
   * @param {number} params.videoId
   * @param {number} [params.newUpload]
   * @param {array<number>} [params.oldTagIds]
   *
   * @augments VideoBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.newUpload = params.newUpload || 0;
    oThis.tagIds = params.oldTagIds || [];
  }

  /**
   * Extra data for event kind.
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
   * Topic kind.
   *
   * @returns {string}
   * @private
   */
  _topicKind() {
    return webhookEventConstants.videoUpdateTopicKind;
  }

  /**
   * Timestamp in seconds for webhook event.
   *
   * @returns {number}
   * @private
   */
  _executeAt() {
    const oThis = this;

    let executionTimestamp = Math.round(new Date() / 1000);

    if (oThis.newUpload) {
      executionTimestamp += 1 * 60;
    }

    return executionTimestamp;
  }
}

module.exports = VideoUpdate;

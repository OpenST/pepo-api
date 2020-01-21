const rootPrefix = '../../..',
  WebhookProcessorBase = require(rootPrefix + '/lib/webhook/processor/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to process webhook for video update.
 *
 * @class VideoUpdate
 */
class VideoUpdate extends WebhookProcessorBase {
  /**
   * Validate and sanitize.
   *
   * @sets oThis.videoIds
   *
   * @returns {Promise<result>}
   */
  async validateAndSanitize() {
    const oThis = this;

    await super.validateAndSanitize();

    if (!oThis.webhookEventExtraData.videoId) {
      return responseHelper.error({
        internal_error_identifier: 'l_we_p_vu_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { webhookEventExtraData: oThis.webhookEventExtraData }
      });
    }

    oThis.videoIds.push(oThis.webhookEventExtraData.videoId);

    return responseHelper.successWithData({});
  }

  /**
   * Get formatter params.
   *
   * @returns {Promise<{}>}
   */
  get formatterParams() {
    const oThis = this;

    return {
      webhookEventKind: oThis.webhookEvent.topicKind,
      webhookEvent: oThis.webhookEvent,
      webhookEndpoint: oThis.webhookEndpoint,
      videoIds: oThis.videoIds,
      videos: oThis.videos,
      videoDetails: oThis.videoDetails,
      texts: oThis.texts,
      userIds: oThis.userIds,
      users: oThis.users,
      tokenUsers: oThis.tokenUserDetails,
      images: oThis.images
    };
  }
}

module.exports = VideoUpdate;

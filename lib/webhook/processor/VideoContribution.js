const rootPrefix = '../../..',
  WebhookProcessorBase = require(rootPrefix + '/lib/webhook/processor/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent');

/**
 * Class to process webhook for video contribution.
 *
 * @class VideoContribution
 */
class VideoContribution extends WebhookProcessorBase {
  /**
   * Constructor to process webhook for video contribution.
   *
   * @param {object} params
   * @param {object} params.webhook_event
   * @param {object} params.webhook_endpoint
   *
   * @augments WebhookProcessorBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.transactionId = null;
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.videoIds, oThis.transactionId
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;

    await super.validateAndSanitize();

    if (!oThis.webhookEventExtraData.videoId || !oThis.webhookEventExtraData.transactionId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_we_p_vc_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { webhookEventExtraData: oThis.webhookEventExtraData }
        })
      );
    }

    oThis.videoIds.push(oThis.webhookEventExtraData.videoId);
    oThis.transactionId = oThis.webhookEventExtraData.transactionId;
  }

  /**
   * Get formatter params.
   *
   * @returns {Promise<{}>}
   */
  get formatterParams() {
    const oThis = this;

    return {
      webhookEventKind: webhookEventConstants.videoUpdateTopicKind,
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

module.exports = VideoContribution;

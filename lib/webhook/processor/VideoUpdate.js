const rootPrefix = '../../..',
  WebhookProcessorBase = require(rootPrefix + '/lib/webhook/processor/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent');

/**
 * Class to process webhook for video update.
 *
 * @class VideoUpdate
 */
class VideoUpdate extends WebhookProcessorBase {
  /**
   * Constructor to process webhook for video update.
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

    oThis.webhookEvent = params.webhook_event;
    oThis.webhookEndpoint = params.webhook_endpoint;

    oThis.videoIds = [];
    oThis.videos = {};
    oThis.videoDetails = {};

    oThis.userIds = [];
    oThis.users = {};
    oThis.tokenUserDetails = {};

    oThis.imageIds = [];
    oThis.images = {};

    oThis.descriptionIds = [];
    oThis.texts = {};
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.videoIds
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;

    await super.validateAndSanitize();

    if (!oThis.webhookEventExtraData.videoId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_we_p_vu_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { webhookEventExtraData: oThis.webhookEventExtraData }
        })
      );
    }

    oThis.videoIds.push(oThis.webhookEventExtraData.videoId);
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

module.exports = VideoUpdate;

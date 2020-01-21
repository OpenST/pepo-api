const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  WebhookProcessorBase = require(rootPrefix + '/lib/webhook/processor/Base'),
  TransactionByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TransactionByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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

    oThis.transactionIds = [];
    oThis.transactions = {};
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.videoIds, oThis.transactionIds
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
    oThis.transactionIds.push(oThis.webhookEventExtraData.transactionId);
  }

  /**
   * Perform class specific actions.
   *
   * @returns {Promise<void>}
   */
  async performClassSpecificActions() {
    const oThis = this;

    await oThis.fetchTransactions();
  }

  /**
   * Fetch transactions.
   *
   * @sets oThis.userIds, oThis.transactions
   *
   * @returns {Promise<*>}
   */
  async fetchTransactions() {
    const oThis = this;

    if (oThis.transactionIds.length === 0) {
      return;
    }

    const cacheResponse = await new TransactionByIdsCache({ ids: oThis.transactionIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data;

    for (let index = 0; index < oThis.transactionIds.length; index++) {
      const transactionId = oThis.transactionIds[index];
      const transactionDetails = cacheData[transactionId];

      if (!CommonValidators.validateNonEmptyObject(transactionDetails)) {
        return responseHelper.error({
          internal_error_identifier: 'l_we_p_vc_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { transactionId: transactionId }
        });
      }

      oThis.userIds.push(transactionDetails.fromUserId);
      oThis.transactions[transactionId] = transactionDetails;
    }
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
      images: oThis.images,
      transactionIds: oThis.transactionIds,
      transactions: oThis.transactions
    };
  }
}

module.exports = VideoContribution;

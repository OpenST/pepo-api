const uuidV4 = require('uuid/v4');

const rootPrefix = '../../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  WebhookEventModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookEvent'),
  WebhookSubscriptionModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookSubscription'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent'),
  webhookSubscriptionConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookSubscription');

/**
 * Base class for webhook video pre-processor.
 *
 * @class VideoBase
 */
class VideoBase {
  /**
   * Constructor for webhook video pre-processor.
   *
   * @param {object} params
   * @param {number} params.videoId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.videoId = params.videoId;

    oThis.videoDetail = null;
    oThis.tagIds = [];
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   * @private
   */
  async perform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._process();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.feedObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    let hasError = false;

    if (!CommonValidators.validateNonZeroInteger(oThis.videoId)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_wpp_v_b_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { videoId: oThis.videoId }
        })
      );
    }
  }

  /**
   * Fetch webhooks subscribed for this event.
   *
   * @sets oThis.feedObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _process() {
    const oThis = this;

    await oThis._fetchVideoDetail();

    await oThis._fetchTagFromText();

    await oThis._insertInWebhookEvent();
  }

  /**
   * Fetch video detail.
   *
   * @sets oThis.videoDetail
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideoDetail() {
    const oThis = this;

    const cacheRsp = await new VideoDetailsByVideoIds({ videoIds: [oThis.videoId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.videoDetail = cacheRsp.data[oThis.videoId];
  }

  /**
   * Fetch tag from text.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTagFromText() {
    const oThis = this;

    const textId = oThis.videoDetail.descriptionId;

    if (!textId) {
      return;
    }

    const includesCacheRsp = await new TextIncludesByIdsCache({ ids: [textId] }).fetch();
    if (includesCacheRsp.isFailure()) {
      return Promise.reject(includesCacheRsp);
    }

    const textIncludes = includesCacheRsp.data[textId];

    for (let ind = 0; ind < textIncludes.length; ind++) {
      const include = textIncludes[ind],
        entity = include.entityIdentifier.split('_');

      if (entity[0] === textIncludeConstants.tagEntityKindShort) {
        oThis.tagIds.push(+entity[1]);
      }
    }
  }

  /**
   * Insert in webhook event.
   *
   * @sets oThis.tagIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInWebhookEvent() {
    const oThis = this;

    if (oThis.tagIds.length === 0) {
      return;
    }

    oThis.tagIds = [...new Set(oThis.tagIds)];

    const topicKindVal =
        webhookSubscriptionConstants.invertedTopicKinds[webhookSubscriptionConstants.tagVideoTopicKind],
      statusInt = webhookSubscriptionConstants.invertedStatuses[webhookSubscriptionConstants.activeStatus],
      limit = 100;

    let offset = 0;

    while (true) {
      const dbRows = await new WebhookSubscriptionModel()
        .select('distinct client_id, w_e_uuid')
        .where({
          content_entity_id: oThis.tagIds,
          status: statusInt,
          topic_kind: topicKindVal
        })
        .order_by('client_id, w_e_uuid')
        .limit(limit)
        .offset(offset)
        .fire();

      if (dbRows.length === 0) {
        return;
      }

      const webhookEndpointUuidMap = {};

      for (let index = 0; index < dbRows.length; index++) {
        const formattedData = new WebhookSubscriptionModel().formatDbData(dbRows[index]);
        webhookEndpointUuidMap[formattedData.webhookEndpointUuid] = formattedData.clientId;
      }

      await oThis._insertIntoWebhookEvents(webhookEndpointUuidMap);

      offset += limit;
    }
  }

  /**
   * Insert in webhook event.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _insertIntoWebhookEvents(webhookEndpointUuidMap) {
    const oThis = this;

    const insertColumns = [
      'client_id',
      'w_e_uuid',
      'uuid',
      'topic_kind',
      'extra_data',
      'status',
      'execute_at',
      'retry_count',
      'internal_error_count',
      'lock_id',
      'error_response'
    ];

    const insertRows = [];

    const defaultInsertParam = [
      webhookEventConstants.invertedTopicKinds[oThis._topicKind()],
      JSON.stringify(oThis._extraDataForWebhookEvent()),
      webhookEventConstants.invertedStatuses[webhookEventConstants.queuedStatus],
      oThis._executeAt(),
      0,
      0,
      null,
      null
    ];

    for (const uuid in webhookEndpointUuidMap) {
      const clientId = webhookEndpointUuidMap[uuid];
      const insertRow = [clientId, uuid, uuidV4()];

      insertRows.push(insertRow.concat(defaultInsertParam));
    }

    await new WebhookEventModel().insertMultiple(insertColumns, insertRows).fire();
  }

  /**
   * Extra data for event kind.
   *
   * @returns {Object}
   * @private
   */
  _extraDataForWebhookEvent() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Topic kind.
   *
   * @returns {string}
   * @private
   */
  _topicKind() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Timestamp in seconds for webhook event.
   *
   * @returns {number}
   * @private
   */
  _executeAt() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = VideoBase;

const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailsByVideoIds = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  WebhookSubscriptionModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookSubscription'),
  WebhookEventModel = require(rootPrefix + '/app/models/mysql/webhook/WebhookEvent'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent'),
  webhookSubscriptionConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookSubscription'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Constructor for VideoContribution.
 *
 * @class VideoContribution
 */
class VideoContribution {
  /**
   * Constructor for VideoContribution.
   *
   * @augments VideoContribution
   * @param {object} params
   * @param {number} params.videoId
   * @param {object} params.transaction
   * @param {string} params.transaction.status
   * @param {string/number} params.transaction.id
   * @param {string/number} params.transaction.fromUserId
   * @param {object} params.transaction.extraData
   * @param {array<string/number>} params.transaction.toUserId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;
    logger.log('VideoContribution===========', params);

    oThis.videoId = params.videoId;
    oThis.transaction = params.transaction;

    oThis.videoDetail = null;
    oThis.tagIds = [];
  }

  /**
   * Async performer.
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
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    let hasError = false;

    if (!CommonValidators.validateNonZeroInteger(oThis.videoId)) {
      hasError = true;
    }
    if (!CommonValidators.validateNonEmptyObject(oThis.transaction)) {
      hasError = true;
    }

    if (!hasError && oThis.transaction.status !== transactionConstants.doneStatus) {
      hasError = true;
    }

    if (!hasError && (!oThis.transaction.id || !oThis.transaction.fromUserId || !oThis.transaction.toUserId)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_wpp_vc_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction, videoId: oThis.videoId }
        })
      );
    }
  }

  /**
   * Fetch webhooks subscribed for this event.
   *
   * @sets oThis.feedObj
   *
   * @private
   */
  async _process() {
    const oThis = this;

    await oThis._fetchVideoDetail();

    await oThis._fetchTagFromText();

    await oThis._insertInWebhookEvent();
  }

  /**
   * Fetch video detail
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

    if (oThis.videoDetail.status !== videoDetailsConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_j_wpp_vc_fvd_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { transaction: oThis.transaction, videoId: oThis.videoId }
        })
      );
    }
  }

  /**
   * Fetch tag from text
   *
   * @returns {Promise<never>}
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

    const allTagIds = [];

    for (let ind = 0; ind < textIncludes.length; ind++) {
      const include = textIncludes[ind],
        entity = include.entityIdentifier.split('_');

      if (entity[0] == textIncludeConstants.tagEntityKindShort) {
        allTagIds.push(+entity[1]);
      }
    }

    oThis.tagIds = [...new Set(allTagIds)];
  }

  /**
   * Insert in Webhook Event
   *
   * @returns {Promise<never>}
   * @private
   */
  async _insertInWebhookEvent() {
    const oThis = this;

    if (oThis.tagIds.length === 0) {
      return;
    }
    const topicKindVal =
        webhookSubscriptionConstants.invertedTopicKinds[webhookSubscriptionConstants.tagVideoTopicKind],
      statusInt = webhookSubscriptionConstants.invertedStatuses[webhookSubscriptionConstants.activeStatus],
      limit = 100;

    let offset = 0;

    while (true) {
      const dbRows = await new WebhookSubscriptionModel()
        .select('distinct client_id, w_e_uuid')
        .where({ content_entity_id: oThis.tagIds, status: statusInt })
        .where(['topic_kinds = topic_kinds | ?', topicKindVal])
        .order_by('client_id, w_e_uuid')
        .limit(limit)
        .offset(offset)
        .fire();

      if (dbRows.length === 0) {
        return;
      }

      const webhookEndpointUuidMap = {};

      for (let i = 0; i < dbRows.length; i++) {
        const formattedData = new WebhookSubscriptionModel().formatDbData(dbRows[i]);
        webhookEndpointUuidMap[formattedData.webhookEndpointUuid] = formattedData.clientId;
      }

      await oThis._insertIntoWebhookEvents(webhookEndpointUuidMap);

      offset += limit;
    }
  }

  /**
   * Insert in webhook event
   *
   * @sets oThis.videoDetail
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
      null,
      null
    ];

    for (let uuid in webhookEndpointUuidMap) {
      let clientId = webhookEndpointUuidMap[uuid];
      const insertRow = [clientId, uuid, uuidV4()];

      insertRows.push(insertRow.concat(defaultInsertParam));
    }

    await new WebhookEventModel().insertMultiple(insertColumns, insertRows).fire();
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
      actorId: oThis.transaction.fromUserId,
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

    return webhookEventConstants.videoContributionTopicKind();
  }

  /**
   * Timestamp in Seconds for webhook event
   *
   * @returns {string}
   * @private
   */
  _executeAt() {
    const oThis = this;

    return Math.round(new Date() / 1000);
  }
}

module.exports = VideoContribution;

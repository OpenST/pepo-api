const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ZoomEventModel = require(rootPrefix + '/app/models/mysql/meeting/ZoomEvent'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  zoomEventConstants = require(rootPrefix + '/lib/globalConstant/zoomEvent');

/**
 * Class to create new zoom event.
 *
 * @class ZoomEventCreate
 */
class ZoomEventCreate extends ServiceBase {
  /**
   * Constructor to create new zoom event.
   *
   * @param {object} params
   * @param {object} params.webhookParams
   * @param {object} params.sanitized_headers
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.eventData = params.webhookParams;
    oThis.sanitizedHeaders = params.sanitized_headers;
    oThis.eventId = oThis.sanitizedHeaders['x-zm-trackingid'];

    oThis.zoomEventId = null;
    oThis.duplicateEvent = false;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    if (oThis.duplicateEvent) {
      return responseHelper.successWithData({});
    }

    await oThis._createEntryInZoomEvent();

    await oThis._publishZoomEvent();

    return responseHelper.successWithData({});
  }

  /**
   * Validate request.
   *
   * @sets oThis.duplicateEvent
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for zoom events.');

    if (!oThis.eventId || !CommonValidators.validateString(oThis.eventId)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_c_vas_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    const zoomEventRes = await new ZoomEventModel().fetchByEventId(oThis.eventId);

    if (zoomEventRes.id) {
      oThis.duplicateEvent = true;
    }
  }

  /**
   * Create entry in zoom event table.
   *
   * @sets oThis.zoomEventId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createEntryInZoomEvent() {
    const oThis = this;

    logger.log('Create entry in Zoom Event.');

    const stringifiedEventData = JSON.stringify(oThis.eventData);

    // Insert in database.
    const insertResponse = await new ZoomEventModel()
      .insert({
        event_id: oThis.eventId,
        status: zoomEventConstants.invertedStatuses[zoomEventConstants.pendingStatus.toUpperCase()],
        event_data: stringifiedEventData
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in zoom_events table');

      return Promise.reject(insertResponse);
    }

    oThis.zoomEventId = insertResponse.insertId;
  }

  /**
   * Publish zoom event ID.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _publishZoomEvent() {
    const oThis = this;

    logger.log('Publish Zoom Event');

    const messagePayload = {
      zoomEventId: oThis.zoomEventId
    };

    logger.info(`Publishing event type ${oThis.eventData.event}`);
    let options = {};

    if (
      oThis.eventData.event === zoomEventConstants.meetingRecordingCompletedTopic ||
      oThis.eventData.event === zoomEventConstants.meetingRecordingTranscriptCompletedTopic
    ) {
      options = { publishAfter: 1000 * 60 * 3 }; // 3 min delay
    }

    logger.info(`Publishing event type ${oThis.eventData.event} with options ${JSON.stringify(options)}`);
    await bgJob.enqueue(bgJobConstants.zoomWebhookJobTopic, messagePayload, options);
  }
}

module.exports = ZoomEventCreate;

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ZoomEventModel = require(rootPrefix + '/app/models/mysql/meeting/ZoomEvent'),
  ZoomEventProcessFactory = require(rootPrefix + '/app/services/zoomEvents/Factory'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  zoomEventConstants = require(rootPrefix + '/lib/globalConstant/zoomEvent'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class to process zoom events.
 *
 * @class ZoomEventProcess
 */
class ZoomEventProcess extends ServiceBase {
  /**
   * Constructor to process zoom events.
   *
   * @param {object} params
   * @param {string} params.zoomEventId: Zoom Event Table Id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.zoomEventId = params.zoomEventId;

    oThis.zoomEventObj = {};
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

    await oThis._fetchZoomEvent();

    await oThis._updateZoomEventStatus(zoomEventConstants.startedStatus);

    await oThis._processEvent();

    return responseHelper.successWithData({});
  }

  /**
   * Validate parameters.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for zoom events process');

    if (!oThis.zoomEventId || !CommonValidators.validateInteger(oThis.zoomEventId)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_p_vas_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }
  }

  /**
   * Fetch entry from zoom event table.
   *
   * @sets oThis.zoomEventObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchZoomEvent() {
    const oThis = this;
    logger.log('fetch entry for Zoom Event process');

    const dbRow = await new ZoomEventModel().fetchById(oThis.zoomEventId);

    if (!dbRow || !dbRow.id || dbRow.status !== zoomEventConstants.pendingStatus) {
      logger.error('Error while fetching data from zoom events table. dbRows=', dbRow);

      return Promise.reject(dbRow);
    }
    oThis.zoomEventObj = dbRow;
  }

  /**
   * Update status of zoom event row.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateZoomEventStatus(zoomEventStatus) {
    const oThis = this;

    logger.log('Update Zoom Event status-', zoomEventStatus);

    const zoomEventstatus = zoomEventConstants.invertedStatuses[zoomEventStatus];

    if (!zoomEventstatus) {
      throw new Error(`Invalid zoomEventstatus for Process. zoomEventStatus=${zoomEventStatus}`);
    }

    await new ZoomEventModel()
      .update({ status: zoomEventstatus, event_data: oThis.zoomEventObj.eventData })
      .where({ id: oThis.zoomEventId })
      .fire();
  }

  /**
   * Use factory to process event.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processEvent() {
    const oThis = this;

    logger.log('Process Zoom Event.');

    const response = await new ZoomEventProcessFactory({ zoomEventObj: oThis.zoomEventObj })
      .perform()
      .catch(async function(err) {
        logger.error(err);

        return responseHelper.error({
          internal_error_identifier: 's_ze_p_vas_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { Error: err, zoomEventObj: oThis.zoomEventObj }
        });
      });

    if (response.isSuccess()) {
      await oThis._updateZoomEventStatus(zoomEventConstants.doneStatus);
    } else {
      await createErrorLogsEntry.perform(response, errorLogsConstants.mediumSeverity);

      const event_data = JSON.parse(oThis.zoomEventObj.eventData);
      const { retryCount } = event_data;
      const currentRetryCount = Number(retryCount) + 1;

      if (
        (event_data.event === zoomEventConstants.meetingRecordingCompletedTopic ||
          event_data.event === zoomEventConstants.meetingRecordingTranscriptCompletedTopic) &&
        currentRetryCount <= zoomEventConstants.maxRetryCount
      ) {
        event_data.retryCount = currentRetryCount;
        await oThis._retryRecordingCompletedAndTranscriptCompleted(event_data);
      } else {
        await oThis._updateZoomEventStatus(zoomEventConstants.failedStatus);
      }
    }
  }

  /**
   * It is for retrying recording and transcript completed web hooks in case of failure.
   * @param {*} event_data event data in the db.
   * @param {*} retryCount Current count in the event object
   */
  async _retryRecordingCompletedAndTranscriptCompleted(event_data) {
    const oThis = this;
    oThis.zoomEventObj.eventData = JSON.stringify(event_data);
    await oThis._updateZoomEventStatus(zoomEventConstants.pendingStatus);

    const messagePayload = {
      zoomEventId: oThis.zoomEventId
    };

    const options = { publishAfter: 1000 * 60 * 3 }; // 3 min delay
    await bgJob.enqueue(bgJobConstants.zoomWebhookJobTopic, messagePayload, options);
  }
}

module.exports = ZoomEventProcess;

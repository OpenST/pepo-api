const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  zoomEventConstants = require(rootPrefix + '/lib/globalConstant/zoomEvent');

/**
 * Class to process Zoom event.
 *
 * @class ZoomEventProcess
 */
class ZoomEventProcess extends ServiceBase {
  /**
   * Constructor to process Zoom event.
   *
   * @param {object} params
   * @param {object} params.zoomEventObj: Zoom Event Table row
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.zoomEventObj = params.zoomEventObj;

    oThis.eventData = {};
    oThis.zoomEventTopic = '';
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._extractEventTopic();

    await oThis._execute();

    return responseHelper.successWithData({});
  }

  /**
   * Extract event topic.
   *
   * @sets oThis.eventData, oThis.zoomEventTopic
   *
   * @returns {Promise<never>}
   * @private
   */
  async _extractEventTopic() {
    const oThis = this;

    try {
      oThis.eventData = JSON.parse(oThis.zoomEventObj.eventData);
      oThis.zoomEventTopic = oThis.eventData.event;
    } catch (err) {
      logger.error('Error in JSON Parse: ', err);

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_f_e_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { Error: err }
        })
      );
    }
  }

  /**
   * Validate parameters.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _execute() {
    const oThis = this;

    let eventProcessResponse = null;

    switch (oThis.zoomEventTopic) {
      case zoomEventConstants.meetingStartedZoomWebhookTopic: {
        const MeetingStartedClass = require(rootPrefix + '/app/services/zoomEvents/meetings/Started');
        eventProcessResponse = await new MeetingStartedClass(oThis.eventData).perform();
        break;
      }
      case zoomEventConstants.meetingEndedZoomWebhookTopic: {
        const MeetingEndedClass = require(rootPrefix + '/app/services/zoomEvents/meetings/Ended');
        eventProcessResponse = await new MeetingEndedClass(oThis.eventData).perform();
        break;
      }
      case zoomEventConstants.meetingAlertZoomWebhookTopic: {
        const MeetingAlertClass = require(rootPrefix + '/app/services/zoomEvents/meetings/Alert');
        eventProcessResponse = await new MeetingAlertClass(oThis.eventData).perform();
        break;
      }
      case zoomEventConstants.meetingParticipantJoinedZoomWebhookTopic: {
        const MeetingParticipantJoinedClass = require(rootPrefix +
          '/app/services/zoomEvents/meetings/ParticipantJoined');
        eventProcessResponse = await new MeetingParticipantJoinedClass(oThis.eventData).perform();
        break;
      }
      case zoomEventConstants.meetingParticipantLeftZoomWebhookTopic: {
        const MeetingParticipantLeftClass = require(rootPrefix + '/app/services/zoomEvents/meetings/ParticipantLeft');
        eventProcessResponse = await new MeetingParticipantLeftClass(oThis.eventData).perform();
        break;
      }
      default: {
        eventProcessResponse = responseHelper.successWithData({});
        console.log('Unused Zoom Event Received with data', JSON.stringify(oThis.eventData));
        break;
      }
    }

    if (eventProcessResponse.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_f_e_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { eventProcessResp: eventProcessResponse, zoomEventObj: oThis.zoomEventObj }
        })
      );
    }
  }
}

module.exports = ZoomEventProcess;

const rootPrefix = '../../../..',
  ZoomEventsForMeetingsBase = require(rootPrefix + '/app/services/zoomEvents/meetings/Base'),
  MeetingIdByZoomMeetingIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingIdByZoomMeetingIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for zoom event webhook processor for participant left the meeting .
 *
 * @class MeetingParticipantLeft
 */
class MeetingParticipantLeft extends ZoomEventsForMeetingsBase {
  /**
   * Constructor
   *
   * @param {object} params
   * @param {object} params.payload
   * @param {object} params.payload.object
   * @param {object} params.payload.object.participant
   * @param {String} params.payload.object.participant.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.zoomParticipantId = params.payload.object.participant.id;

    oThis.meetingObj = {};
    oThis.leaveTimestamp = null;
    oThis.processEvent = true;
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateParams();

    await oThis.validateAndSetMeetingId();

    await oThis._fetchAndValidateMeetingHost();

    await oThis._incrementHostLeaveCount();

    return responseHelper.successWithData({});
  }

  /**
   * Validate params.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    if (!oThis.zoomParticipantId) {
      oThis.processEvent = false;
      return;
    }

    const id = oThis.zoomParticipantId.split('_');
    if (id[0] === 'u') {
      oThis.participantId = id[1];
    } else {
      oThis.processEvent = false;

      return responseHelper.successWithData({});
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch and validate meeting host.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchAndValidateMeetingHost() {
    const oThis = this;

    if (!oThis.processEvent) {
      return responseHelper.successWithData({});
    }

    logger.log('MeetingParticipantLeft: Fetching meeting obj.');

    if (!oThis.meetingId) {
      oThis.processEvent = false;

      return responseHelper.successWithData({});
    }

    const cacheRes2 = await new MeetingByIdsCache({ ids: [oThis.meetingId] }).fetch();

    if (cacheRes2.isFailure()) {
      return Promise.reject(cacheRes2);
    }

    oThis.meetingObj = cacheRes2.data[oThis.meetingId];

    if (oThis.meetingObj.hostUserId !== oThis.participantId) {
      oThis.processEvent = false;

      return responseHelper.successWithData({});
    }
  }

  /**
   * Increment host leave count.
   *
   * @return {Promise<void>}
   * @private
   */
  async _incrementHostLeaveCount() {
    const oThis = this;

    if (!oThis.processEvent) {
      return responseHelper.successWithData({});
    }

    logger.log('MeetingParticipantLeft: Increment host leave count.');

    await new MeetingModel()
      .update('host_leave_count = host_leave_count + 1')
      .where({ id: oThis.meetingId })
      .fire();

    await MeetingModel.flushCache({ id: oThis.meetingId });

    await bgJob.enqueue(
      bgJobConstants.endZoomMeetingJobTopic,
      { meetingId: oThis.meetingId },
      { publishAfter: 3 * 60 * 1000 } //3 minutes
    );

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingParticipantLeft;

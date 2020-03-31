const rootPrefix = '../../../..',
  ZoomEventsForMeetingsBase = require(rootPrefix + '/app/services/zoomEvents/meetings/Base'),
  MeetingIdByZoomMeetingIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingIdByZoomMeetingIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for zoom event webhook processor for participant joined the meeting .
 *
 * @class MeetingParticipantJoined
 */
class MeetingParticipantJoined extends ZoomEventsForMeetingsBase {
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

    oThis.meetingId = null;
    oThis.meetingObj = {};
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

    await oThis._incrementHostJoinCount();

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

    logger.log('MeetingParticipantJoined: Fetching meeting obj.');

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
   * Increment host join count.
   *
   * @return {Promise<void>}
   * @private
   */
  async _incrementHostJoinCount() {
    const oThis = this;

    if (!oThis.processEvent) {
      return responseHelper.successWithData({});
    }

    logger.log('MeetingParticipantJoined: Increment host join count.');

    await new MeetingModel()
      .update('host_join_count = host_join_count + 1')
      .where({ id: oThis.meetingId })
      .fire();

    await MeetingModel.flushCache({ id: oThis.meetingId });

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingParticipantJoined;

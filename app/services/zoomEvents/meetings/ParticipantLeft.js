const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  MeetingIdByZoomMeetingIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingIdByZoomMeetingIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for zoom meeting started webhook processor.
 *
 * @class MeetingParticipantLeft
 */
class MeetingParticipantLeft extends ServiceBase {
  /**
   * Constructor
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.zoomMeetingId = params.payload.object.id;
    oThis.leaveTime = params.payload.object.participant.leave_time;
    oThis.zoomParticipantId = params.payload.object.participant.id;

    oThis.meetingId = null;
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

    await oThis._fetchAndValidateMeetingHost();

    if (!oThis.processEvent) {
      return responseHelper.successWithData({});
    }

    await oThis._incrementHostLeaveCount();
  }

  async _validateParams() {
    const oThis = this;

    if (!CommonValidators.validateNonBlankString(oThis.leaveTime)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_m_pl_vp_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    oThis.leaveTimestamp = new Date(oThis.leaveTime).getTime() / 1000;

    if (oThis.leaveTimestamp == 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_m_pl_vp_2',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch .
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchAndValidateMeetingHost() {
    const oThis = this;

    const id = oThis.zoomParticipantId.split('_');
    if (id[0] === 'u') {
      oThis.participantId = id[1];
    } else {
      oThis.processEvent = false;

      return responseHelper.successWithData({});
    }

    logger.log('Fetching meeting obj.');

    const cacheRes1 = await new MeetingIdByZoomMeetingIdsCache({ zoomMeetingIds: [oThis.zoomMeetingId] }).fetch();

    if (cacheRes1.isFailure()) {
      return Promise.reject(cacheRes1);
    }

    oThis.meetingId = cacheRes1.data[oThis.zoomMeetingId].id;

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

    logger.log('Increment host leave count.');

    await new MeetingModel()
      .update('host_leave_count = host_leave_count + 1')
      .where({ id: oThis.meetingId })
      .fire();

    await MeetingModel.flushCache({ id: oThis.meetingId });

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingParticipantLeft;

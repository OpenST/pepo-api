const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  MeetingIdByZoomMeetingIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingIdByZoomMeetingIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting');

/**
 * Class for zoom meeting started webhook processor.
 *
 * @class MeetingStarted
 */
class MeetingStarted extends ServiceBase {
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
    oThis.startTime = params.payload.object.start_time;
    oThis.zoomMeetingId = params.payload.object.id;

    oThis.meetingId = null;
    oThis.meetingObj = {};
    oThis.startTimestamp = null;
    oThis.processEvent = true;

    console.log('HERE====constructor===MeetingStarted======', JSON.stringify(params));
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateParams();

    await oThis._fetchAndValidateMeetingStatus();

    if (!oThis.processEvent) {
      return responseHelper.successWithData({});
    }

    await oThis._updateMeetingStatus();

    return responseHelper.successWithData({});
  }

  /**
   * Validate Params.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    if (!CommonValidators.validateNonBlankString(oThis.startTime)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_m_s_vp_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    oThis.startTimestamp = new Date(oThis.startTime).getTime() / 1000;

    if (oThis.startTimestamp == 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_m_s_vp_2',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch meeting obj.
   *
   * @sets oThis.meetingId, oThis.meetingObj
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchAndValidateMeetingStatus() {
    const oThis = this;

    logger.log('Fetching meeting obj.');

    let cacheRes1 = await new MeetingIdByZoomMeetingIdsCache({ zoomMeetingIds: [oThis.zoomMeetingId] }).fetch();

    if (cacheRes1.isFailure()) {
      return Promise.reject(cacheRes1);
    }

    oThis.meetingId = cacheRes1.data[oThis.zoomMeetingId].id;

    if (!oThis.meetingId) {
      oThis.processEvent = false;
      return responseHelper.successWithData({});
    }

    const cahceRes2 = await new MeetingByIdsCache({ ids: [oThis.meetingId] }).fetch();

    if (cahceRes2.isFailure()) {
      return Promise.reject(cahceRes2);
    }

    oThis.meetingObj = cahceRes2.data[oThis.meetingId];

    if (!oThis.meetingObj.id || meetingConstants.waitingStatus !== oThis.meetingObj.status) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_m_s_fm_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { meetingObj: oThis.meetingObj }
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Update meeting status to started.
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateMeetingStatus() {
    const oThis = this;

    logger.log('update meeting status.');

    await new MeetingModel()
      .update({
        status: meetingConstants.invertedStatuses[meetingConstants.startedStatus],
        start_timestamp: oThis.startTimestamp
      })
      .where({ id: oThis.meetingId })
      .fire();

    await MeetingModel.flushCache({ id: oThis.meetingId });

    oThis.meetingObj = meetingConstants.startedStatus;

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingStarted;

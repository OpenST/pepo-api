const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  MeetingIdByZoomMeetingIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingIdByZoomMeetingIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  MeetingRelayerModel = require(rootPrefix + '/app/models/mysql/meeting/MeetingRelayer'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  meetingRelayerConstants = require(rootPrefix + '/lib/globalConstant/meeting/meetingRelayer'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting');

/**
 * Class for zoom meeting ended webhook processor.
 *
 * @class MeetingEnded
 */
class MeetingEnded extends ServiceBase {
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
    oThis.endTime = params.payload.object.end_time;
    oThis.zoomMeetingId = params.payload.object.id;

    oThis.meetingId = null;
    oThis.meetingObj = {};
    oThis.endTimestamp = null;
    oThis.processEvent = true;

    console.log('HERE====constructor===MeetingEnded======', JSON.stringify(params));
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

    await oThis._updateMeeting();

    await oThis._markMeetingRelayerAsAvailable();

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

    if (!CommonValidators.validateNonBlankString(oThis.endTime)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_m_e_vp_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    oThis.endTimestamp = new Date(oThis.endTime).getTime() / 1000;

    if (oThis.endTimestamp == 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_m_e_vp_2',
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

    if (!oThis.meetingObj.id || meetingConstants.startedStatus !== oThis.meetingObj.status) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_m_e_fm_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { meetingObj: oThis.meetingObj }
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Update meeting status to ended and endTimestamp and isLive.
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateMeeting() {
    const oThis = this;

    logger.log('update meeting.');

    //mark as ended and relayed users state
    await new MeetingModel()
      .update({
        status: meetingConstants.invertedStatuses[meetingConstants.endedStatus],
        end_timestamp: oThis.endTimestamp,
        is_live: null
      })
      .where({ id: oThis.meetingId })
      .fire();

    await MeetingModel.flushCache({ id: oThis.meetingId });

    oThis.meetingObj.status = meetingConstants.endedStatus;
    oThis.meetingObj.endTimestamp = oThis.endTimestamp;
    oThis.meetingObj.isLive = null;

    return responseHelper.successWithData({});
  }

  /**
   * Update meeting relayer to started.
   *
   * @return {Promise<void>}
   * @private
   */
  async _markMeetingRelayerAsAvailable() {
    const oThis = this;

    logger.log('update meeting relayer as available.');

    await new MeetingRelayerModel()
      .update({
        status: meetingRelayerConstants.invertedStatuses[meetingRelayerConstants.availableStatus]
      })
      .where({ id: oThis.meetingObj.meetingRelayerId })
      .fire();

    await MeetingRelayerModel.flushCache({ id: oThis.meetingObj.meetingRelayerId });

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingEnded;

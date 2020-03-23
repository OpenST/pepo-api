const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  MeetingIdByZoomMeetingIdsCache = require(rootPrefix + 'lib/cacheManagement/multi/meeting/MeetingIdByZoomMeetingIds'),
  MeetingByIdsCache = require(rootPrefix + 'lib/cacheManagement/multi/meeting/MeetingByIds'),
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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
    oThis.endTime = params.object.end_time;
    oThis.zoomMeetingId = params.object.uuid;

    oThis.meetingId = null;
    oThis.meetingObj = {};
    oThis.endTimestamp = null;

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

    await oThis._updateMeetingStatus();

    await oThis._markMeetingRelayerAsAvailable();

    // get recording data

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

    oThis.endTimestamp = new Date(oThis.endTime).getTime();

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
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_ze_m_e_fm_1',
          api_error_identifier: 'resource_not_found'
        })
      );
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
   * Update meeting status to ended.
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateMeetingStatus() {
    const oThis = this;

    logger.log('update meeting status.');
    //mark as ended and relayed users state
    await new MeetingModel()
      .update({
        status: meetingConstants.invertedStatuses[meetingConstants.endedStatus],
        end_timestamp: oThis.endTimestamp
      })
      .where({ id: oThis.meetingId })
      .fire();

    await MeetingModel.flushCache({ id: oThis.meetingId });

    oThis.meetingObj.status = meetingConstants.endedStatus;
    oThis.meetingObj.endTimestamp = oThis.endTimestamp;

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

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingEnded;

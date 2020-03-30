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
    oThis.startTime = params.payload.object.start_time;
    oThis.zoomMeetingId = params.payload.object.id;

    oThis.meetingId = null;
    oThis.meetingObj = {};
    oThis.endTimestamp = null;
    oThis.startTimestamp = null;
    oThis.processEvent = true;
  }

  /**
   * Async performer. This will end meeting locally in the database. If
   * meeting is already ended in database, it will try to update the start and
   * end timestamps. Relayer is marked as available only if meeting is
   * currently alive.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._parseParams();

    await oThis._fetchAndValidateMeetingStatus();

    if (!oThis.processEvent) {
      return responseHelper.successWithData({});
    }

    await oThis._updateMeetingTimestamps();

    await oThis._updateMeeting();

    if (!oThis.processEvent) {
      return responseHelper.successWithData({});
    }

    await oThis._markMeetingRelayerAsAvailable();

    return responseHelper.successWithData({});
  }

  /**
   * Parse the input Params.
   *
   * @return {Promise<void>}
   * @private
   */
  async _parseParams() {
    const oThis = this;

    oThis.endTimestamp = oThis.endTime ? new Date(oThis.endTime).getTime() / 1000 : undefined;
    oThis.startTimestamp = oThis.startTime ? new Date(oThis.startTime).getTime() / 1000 : undefined;

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

    if (!oThis.meetingObj.id) {
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
   * Update meeting start or end Timestamp.
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateMeetingTimestamps() {
    const oThis = this;

    logger.log('update _updateMeetingTimestamps.');
    const updateParams = {};

    if (oThis.startTimestamp) {
      updateParams.start_timestamp = oThis.startTimestamp;
    }

    if (oThis.endTimestamp) {
      updateParams.end_timestamp = oThis.endTimestamp;
    }

    if (CommonValidators.validateNonEmptyObject(updateParams)) {
      await new MeetingModel()
        .update(updateParams)
        .where({ id: oThis.meetingId })
        .fire();

      await MeetingModel.flushCache({ id: oThis.meetingId });
    }
  }

  /**
   * Update meeting status and isLive.
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateMeeting() {
    const oThis = this;

    logger.log('update meeting.');

    if (!oThis.meetingObj.isLive) {
      oThis.processEvent = false;
      return responseHelper.successWithData({});
    }

    //mark as ended and relayed users state
    const updateParams = {
      status: meetingConstants.invertedStatuses[meetingConstants.endedStatus],
      is_live: null
    };

    const updateResp = await new MeetingModel()
      .update(updateParams)
      .where({ id: oThis.meetingId, is_live: meetingConstants.isLiveStatus })
      .fire();

    if (updateResp.affectedRows === 0) {
      oThis.processEvent = false;
      return responseHelper.successWithData({});
    }

    await MeetingModel.flushCache({ id: oThis.meetingId, channelId: oThis.meetingObj.channelId });

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
      .where({ status: meetingRelayerConstants.invertedStatuses[meetingRelayerConstants.reservedStatus] })
      .fire();

    await MeetingRelayerModel.flushCache({ id: oThis.meetingObj.meetingRelayerId });

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingEnded;

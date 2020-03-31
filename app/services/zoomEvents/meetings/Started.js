const rootPrefix = '../../../..',
  ZoomEventsForMeetingsBase = require(rootPrefix + '/app/services/zoomEvents/meetings/Base'),
  MeetingIdByZoomMeetingIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingIdByZoomMeetingIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting');

/**
 * Class for zoom meeting started web-hook processor.
 *
 * @class MeetingStarted
 */
class MeetingStarted extends ZoomEventsForMeetingsBase {
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

    await oThis.validateAndSetMeetingId();

    await oThis._fetchAndValidateMeetingStatus();

    if (!oThis.processEvent) {
      return responseHelper.successWithData({});
    }

    const updateMeetingStatusRsp = await oThis._updateMeetingStatus();

    if (updateMeetingStatusRsp.data && updateMeetingStatusRsp.data.affectedRows > 0) {
      await oThis._performNotificationsRelatedTasks();
    }

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
   * @sets oThis.meetingObj
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchAndValidateMeetingStatus() {
    const oThis = this;

    logger.log('MeetingStarted: Fetching meeting obj.');

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

    logger.log('MeetingStarted: Updating meeting status.');

    const updateResponse = await new MeetingModel()
      .update({
        status: meetingConstants.invertedStatuses[meetingConstants.startedStatus],
        start_timestamp: oThis.startTimestamp
      })
      .where([
        'id = ? AND status != ?',
        oThis.meetingId,
        meetingConstants.invertedStatuses[meetingConstants.startedStatus]
      ])
      .fire();

    await MeetingModel.flushCache({ id: oThis.meetingId, channelId: oThis.meetingObj.channelId });

    return responseHelper.successWithData({ affectedRows: updateResponse.affectedRows });
  }

  /**
   * Perform notifications related tasks.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performNotificationsRelatedTasks() {
    const oThis = this;

    // Send notifications to channel members when channel host goes live.
    await notificationJobEnqueue.enqueue(notificationJobConstants.channelGoLiveNotificationsKind, {
      channelId: oThis.meetingObj.channelId,
      meetingHostUserId: oThis.meetingObj.hostUserId,
      meetingId: oThis.meetingId
    });

    oThis.meetingObj = meetingConstants.startedStatus;

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingStarted;

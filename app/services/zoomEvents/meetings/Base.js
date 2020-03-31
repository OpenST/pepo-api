const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  MeetingIdByZoomMeetingIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingIdByZoomMeetingIds'),
  MeetingIdByZoomUuidsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingIdByZoomUuids'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for zoom events for meetings base.
 *
 * @class ZoomEventsForMeetingsBase
 */
class ZoomEventsForMeetingsBase extends ServiceBase {
  /**
   * Constructor for zoom events for meetings base.
   *
   * @param {object} params
   * @param {object} params.payload: event payload from zoom.
   * @param {object} params.payload.object : event payload object from zoom.
   * @param {object} params.payload.object.id: zoom id event payload from zoom.
   * @param {object} params.payload.object.uuid: zoom uuid from event payload from zoom.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.zoomMeetingId = params.payload.object.id;
    oThis.zoomMeetingUuid = params.payload.object.uuid;

    oThis.meetingId = null;
  }

  /**
   * Validate and set meeting id on basis of zoom meeting id or zoom meeting uuid.
   *
   * @sets oThis.meetingId
   *
   * @returns {Promise<void>}
   * @private
   */
  async validateAndSetMeetingId() {
    const oThis = this;

    // If zoom meeting id is present, fetch meetings table id from MeetingIdByZoomMeetingIds cache.
    if (CommonValidators.validateNonBlankString(oThis.zoomMeetingId)) {
      let meetingIdByZoomMeetingIdsCacheRsp = await new MeetingIdByZoomMeetingIdsCache({
        zoomMeetingIds: [oThis.zoomMeetingId]
      }).fetch();

      if (meetingIdByZoomMeetingIdsCacheRsp.isFailure()) {
        return Promise.reject(meetingIdByZoomMeetingIdsCacheRsp);
      }

      oThis.meetingId = meetingIdByZoomMeetingIdsCacheRsp.data[oThis.zoomMeetingId].id;
    } else if (CommonValidators.validateNonBlankString(oThis.zoomMeetingUuid)) {
      // otherwise, use MeetingIdByZoomUuids cache.

      let meetingIdByZoomUuidsCacheRsp = await new MeetingIdByZoomUuidsCache({
        zoomUuids: [oThis.zoomMeetingUuid]
      }).fetch();

      if (meetingIdByZoomUuidsCacheRsp.isFailure()) {
        return Promise.reject(meetingIdByZoomUuidsCacheRsp);
      }

      oThis.meetingId = meetingIdByZoomUuidsCacheRsp.data[oThis.zoomMeetingUuid].id;
    } else {
      // If both are absent, throw error.
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_ze_m_b_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }
  }
}

module.exports = ZoomEventsForMeetingsBase;

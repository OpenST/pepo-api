const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ZoomMeetingLib = require(rootPrefix + '/lib/zoom/meeting'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  MeetingByIdsCache = require(rootPrefix + 'lib/cacheManagement/multi/meeting/MeetingByIds'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  zoomConstant = require(rootPrefix + '/lib/globalConstant/meeting/zoom'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 * Class to get meeting join details.
 *
 * @class GetMeetingJoin
 */
class GetMeetingJoin extends ServiceBase {
  /**
   * Constructor.
   *
   * @param {object} params
   * @param {string} [params.channel_permalink]
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelPermalink = params.channel_permalink;
    oThis.currentUser = params.current_user;

    oThis.channelId = null;
    oThis.channel = {};
    oThis.meeting = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndValidateChannel();

    await oThis._fetchAndValidateMeeting();

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channel, oThis.channelId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateChannel() {
    const oThis = this;

    const lowercaseChannelPermalink = oThis.channelPermalink.toLowerCase();
    const cacheResponse = await new ChannelByPermalinksCache({
      permalinks: [lowercaseChannelPermalink]
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const permalinkIdsMap = cacheResponse.data;

    if (!CommonValidators.validateNonEmptyObject(permalinkIdsMap[lowercaseChannelPermalink])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_g_favc_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelPermalink: oThis.channelPermalink
          }
        })
      );
    }

    oThis.channelId = permalinkIdsMap[lowercaseChannelPermalink].id;

    const channelCacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (channelCacheResponse.isFailure()) {
      return Promise.reject(channelCacheResponse);
    }

    oThis.channel = channelCacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(oThis.channel) ||
      oThis.channel.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_c_m_g_favc_2',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: oThis.channel
          }
        })
      );
    }
  }

  /**
   * Fetch and validate meeting.
   *
   * @sets oThis.meeting
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateMeeting() {
    const oThis = this;

    const cahceRes = await new MeetingByIdsCache({ ids: [oThis.meetingId] }).fetch();

    if (cahceRes.isFailure()) {
      return Promise.reject(cahceRes);
    }

    oThis.meeting = cahceRes.data[oThis.meetingId];

    if (!CommonValidators.validateNonEmptyObject(oThis.meeting) || oThis.meeting.channelId != oThis.channelId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_c_m_g_favm_1',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_meeting_id'],
          debug_options: {
            meetingId: oThis.meetingId,
            channelId: oThis.channelId
          }
        })
      );
    }

    if (!oThis.meeting.isLive) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_m_g_favm_2',
          api_error_identifier: 'meeting_has_ended',
          debug_options: {
            meetingId: oThis.meetingId
          }
        })
      );
    }
  }

  /**
   * Prepare response.
   *
   * @returns {{joinZoomMeetingPayload: *, }}
   * @private
   */
  _prepareResponse() {
    const oThis = this;
    const role = oThis.currentUser && oThis.currentUser.id == oThis.meeting.hostUserId ? 1 : 0;

    const signature = ZoomMeetingLib.getSignature(oThis.meeting.zoomMeetingId, role);

    const joinZoomMeetingPayload = {
      zoomMeetingId: oThis.meeting.zoomMeetingId,
      signature: signature,
      name: 'Dummy',
      profile_pic_url: null,
      role: role,
      api_key: zoomConstant.api_key
    };

    return {
      [entityTypeConstants.joinZoomMeetingPayload]: joinZoomMeetingPayload
    };
  }
}

module.exports = GetMeetingJoin;

const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  zoomMeetingLib = require(rootPrefix + '/lib/zoom/meeting'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  zoomConstants = require(rootPrefix + '/lib/globalConstant/meeting/zoom'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 * Class to get meeting join payload.
 *
 * @class GetJoinMeetingPayload
 */
class GetJoinMeetingPayload extends ServiceBase {
  /**
   * Constructor to get meeting join payload.
   *
   * @param {object} params
   * @param {string} [params.channel_permalink]
   * @param {object} params.current_user
   * @param {number} params.meeting_id
   * @param {number} params.fingerprint_id
   * @param {string} params.guest_name
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelPermalink = params.channel_permalink;
    oThis.currentUser = params.current_user || {};
    oThis.meetingId = params.meeting_id;
    oThis.fingerprintId = params.fingerprint_id;
    oThis.name = params.guest_name || 'Pepo Guest';

    oThis.channelId = null;
    oThis.channel = {};
    oThis.meeting = {};
    oThis.profilePicUrl = null;
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

    await oThis._fetchEntities();

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
          internal_error_identifier: 'a_s_c_m_gjp_favc_1',
          api_error_identifier: 'resource_not_found',
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
          internal_error_identifier: 'a_s_c_m_gjp_favc_2',
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
          internal_error_identifier: 'a_s_c_m_gjp_favm_1',
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
          internal_error_identifier: 'a_s_c_m_gjp_favm_2',
          api_error_identifier: 'meeting_has_ended',
          debug_options: oThis.meeting
        })
      );
    }
  }

  /**
   * Fetch and validate meeting.
   *
   * @sets oThis.name
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchEntities() {
    const oThis = this;

    if (oThis.currentUser.id) {
      oThis.name = oThis.currentUser.name;
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

    const role = oThis.currentUser.id && oThis.currentUser.id == oThis.meeting.hostUserId ? 1 : 0;

    let participantId = null;
    if (oThis.currentUser.id) {
      participantId = 'u_' + oThis.currentUser.id;
    } else if (oThis.fingerprintId) {
      participantId = 'f_' + oThis.fingerprintId;
    } else {
      const randStr =
        Math.random()
          .toString(36)
          .slice(2) +
        Math.random()
          .toString(36)
          .slice(2);
      participantId = 'd_' + randStr.slice(0, 20);
    }

    const signature = zoomMeetingLib.getSignature(oThis.meeting.zoomMeetingId, role);

    const joinZoomMeetingPayload = {
      zoomMeetingId: oThis.meeting.zoomMeetingId,
      signature: signature,
      name: oThis.name,
      api_key: zoomConstants.apiKey,
      participantId: participantId
    };

    return {
      [entityTypeConstants.joinZoomMeetingPayload]: joinZoomMeetingPayload
    };
  }
}

module.exports = GetJoinMeetingPayload;

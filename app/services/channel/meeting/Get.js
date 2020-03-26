const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 * Class to get channel meeting details.
 *
 * @class GetChannelMeeting
 */
class GetChannelMeeting extends ServiceBase {
  /**
   * Constructor to get channel meeting details.
   *
   * @param {object} params
   * @param {string} [params.channel_permalink]
   * @param {number} params.meeting_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelPermalink = params.channel_permalink;
    oThis.meetingId = params.meeting_id;

    oThis.channelId = null;
    oThis.channel = {};

    oThis.meeting = {};
    oThis.hostUserId = null;
    oThis.userIds = [];

    oThis.userDetails = {};
    oThis.imageIds = [];

    oThis.tokenUsersByUserIdMap = {};

    oThis.imageDetails = {};
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
   * @sets oThis.meeting, oThis.hostUserId, oThis.userIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateMeeting() {
    const oThis = this;

    const cacheResponse = await new MeetingByIdsCache({ ids: [oThis.meetingId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.meeting = cacheResponse.data[oThis.meetingId];

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
          debug_options: oThis.meeting
        })
      );
    }

    oThis.hostUserId = oThis.meeting.hostUserId;
    oThis.userIds.push(oThis.meeting.hostUserId);
  }

  /**
   * Fetch and validate meeting.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchEntities() {
    const oThis = this;

    await Promise.all([oThis._fetchUserDetails(), oThis._fetchTokenUsers()]);

    await oThis._fetchImages();
  }

  /**
   * Fetch user details.
   *
   * @sets oThis.userDetails, oThis.imageIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserDetails() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return;
    }

    const userDetailsResponse = await new UsersCache({ ids: oThis.userIds }).fetch();
    if (userDetailsResponse.isFailure()) {
      return Promise.reject(userDetailsResponse);
    }

    oThis.userDetails = userDetailsResponse.data;

    if (oThis.userDetails[oThis.hostUserId].profileImageId) {
      oThis.imageIds.push(oThis.userDetails[oThis.hostUserId].profileImageId);
    }
  }

  /**
   * Fetch token users.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return;
    }

    const tokenUsersResponse = await new TokenUserDetailByUserIdsCache({ userIds: oThis.userIds }).fetch();
    if (tokenUsersResponse.isFailure()) {
      return Promise.reject(tokenUsersResponse);
    }

    oThis.tokenUsersByUserIdMap = tokenUsersResponse.data;
  }

  /**
   * Fetch profile image of users.
   *
   * @sets oThis.imageDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length === 0) {
      return;
    }

    const imageCacheResponse = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();
    if (imageCacheResponse.isFailure()) {
      return Promise.reject(imageCacheResponse);
    }

    oThis.imageDetails = imageCacheResponse.data;
  }

  /**
   * Prepare response.
   *
   * @returns {{joinZoomMeetingPayload: *, }}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return {
      [entityTypeConstants.meeting]: oThis.meeting,
      [entityTypeConstants.channelsMap]: { [oThis.channelId]: oThis.channel },
      usersByIdMap: oThis.userDetails,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      imageMap: oThis.imageDetails
    };
  }
}

module.exports = GetChannelMeeting;

const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
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

    oThis.textIds = [];
    oThis.texts = {};

    oThis.imageIds = [];
    oThis.images = {};

    oThis.tagIds = [];
    oThis.tags = {};
    oThis.links = {};

    oThis.userDetails = {};

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

    await Promise.all([oThis._fetchChannelTagIds(), oThis._fetchUserDetails(), oThis._fetchTokenUsers()]);

    await oThis._fetchAssociatedEntities();

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channel, oThis.channelId, oThis.textIds, oThis.imageIds
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

    if (oThis.channel.taglineId) {
      oThis.textIds.push(oThis.channel.taglineId);
    }

    if (oThis.channel.descriptionId) {
      oThis.textIds.push(oThis.channel.descriptionId);
    }

    if (oThis.channel.coverImageId) {
      oThis.imageIds.push(oThis.channel.coverImageId);
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
   * Fetch channel tag ids.
   *
   * @sets oThis.tagIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelTagIds() {
    const oThis = this;

    const cacheResponse = await new ChannelTagByChannelIdsCache({ channelIds: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.tagIds = cacheResponse.data[oThis.channelId];
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
   * Fetch associated entities.
   *
   * @sets oThis.images, oThis.texts
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAssociatedEntities() {
    const oThis = this;

    const associatedEntitiesResponse = await new FetchAssociatedEntities({
      textIds: oThis.textIds,
      imageIds: oThis.imageIds,
      tagIds: oThis.tagIds
    }).perform();
    if (associatedEntitiesResponse.isFailure()) {
      return Promise.reject(associatedEntitiesResponse);
    }

    oThis.images = associatedEntitiesResponse.data.imagesMap;
    oThis.texts = associatedEntitiesResponse.data.textMap;
    oThis.tags = associatedEntitiesResponse.data.tags;
    oThis.links = associatedEntitiesResponse.data.links;
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
      [entityTypeConstants.channelDetailsMap]: { [oThis.channel.id]: oThis.channel },
      [entityTypeConstants.channelIdToTagIdsMap]: { [oThis.channel.id]: oThis.tagIds },
      usersByIdMap: oThis.userDetails,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      [entityTypeConstants.textsMap]: oThis.texts,
      linkMap: oThis.links,
      imageMap: oThis.images,
      tags: oThis.tags
    };
  }
}

module.exports = GetChannelMeeting;

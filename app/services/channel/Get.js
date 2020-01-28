const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

/**
 * Class to get channel details.
 *
 * @class GetChannel
 */
class GetChannel extends ServiceBase {
  /**
   * Constructor to get channel details.
   *
   * @param {object} params
   * @param {number} params.channel_id
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelId = params.channel_id;
    oThis.currentUser = params.current_user;

    oThis.channel = {};
    oThis.channelStatsMap = {};
    oThis.currentUserChannelRelations = {
      [oThis.channelId]: {
        id: oThis.currentUser.id,
        isAdmin: 0,
        isMember: 0,
        notificationStatus: 0,
        updatedAt: 0
      }
    };

    oThis.textIds = [];
    oThis.texts = {};

    oThis.imageIds = [];
    oThis.images = {};

    oThis.tagIds = [];
    oThis.tags = {};
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

    await oThis._fetchChannelTagIds();

    const promisesArray = [
      oThis._fetchChannelStats(),
      oThis._fetchUserChannelRelations(),
      oThis._fetchAssociatedEntities()
    ];

    await Promise.all(promisesArray);

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch and validate channel.
   *
   * @sets oThis.channel, oThis.textIds, oThis.imageIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateChannel() {
    const oThis = this;

    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channel = cacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(oThis.channel) ||
      oThis.channel.status !== channelConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_c_g_1',
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

    const channelTagsArray = cacheResponse.data[oThis.channelId];
    for (let index = 0; index < channelTagsArray.length; index++) {
      const channelTag = channelTagsArray[index];
      oThis.tagIds.push(channelTag.tagId);
    }
  }

  /**
   * Fetch channel stats.
   *
   * @sets oThis.channelStatsMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelStats() {
    const oThis = this;

    const cacheResponse = await new ChannelStatByChannelIdsCache({ channelIds: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelStatsMap = cacheResponse.data;

    if (!CommonValidators.validateNonEmptyObject(oThis.channelStatsMap[oThis.channelId])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_g_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId,
            channelStats: oThis.channelStatsMap[oThis.channelId]
          }
        })
      );
    }
  }

  /**
   * Fetch current user channel relations.
   *
   * @sets oThis.currentUserChannelRelations
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserChannelRelations() {
    const oThis = this;

    const userId = oThis.currentUser.id;
    const cacheResponse = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: userId,
      channelIds: [oThis.channelId]
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelUserRelation = cacheResponse.data[oThis.channelId];
    if (
      CommonValidators.validateNonEmptyObject(channelUserRelation) &&
      channelUserRelation.status === channelUsersConstants.activeStatus
    ) {
      oThis.currentUserChannelRelations[oThis.channelId] = {
        id: oThis.currentUser.id,
        isAdmin: Number(channelUserRelation.role === channelUsersConstants.adminRole),
        isMember: 1,
        notificationStatus: Number(
          channelUserRelation.notificationStatus === channelUsersConstants.activeNotificationStatus
        ),
        updatedAt: channelUserRelation.updatedAt
      };
    }
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
  }

  /**
   * Prepare response.
   *
   * @returns {{images: *, texts: *, channel: *, channelStats: *}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const channelIdToTagIdsMap = { [oThis.channelId]: oThis.tagIds };

    return {
      [entityTypeConstants.channel]: oThis.channel,
      [entityTypeConstants.channelDetailsMap]: { [oThis.channel.id]: oThis.channel },
      [entityTypeConstants.channelIdToTagIdsMap]: channelIdToTagIdsMap,
      [entityTypeConstants.channelStatsMap]: oThis.channelStatsMap,
      [entityTypeConstants.currentUserChannelRelationsMap]: oThis.currentUserChannelRelations,
      [entityTypeConstants.textsMap]: oThis.texts,
      imageMap: oThis.images,
      tags: oThis.tags
    };
  }
}

module.exports = GetChannel;

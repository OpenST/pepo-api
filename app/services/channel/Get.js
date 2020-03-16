const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/GetCurrentUserChannelRelations'),
  ChannelByPermalinksCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByPermalinks'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

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
   * @param {string} params.channel_permalink
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

    oThis.channelPermalink = params.channel_permalink || '';
    oThis.channelId = params.channel_id || null;
    oThis.currentUser = params.current_user;

    oThis.channel = {};
    oThis.channelStatsMap = {};
    oThis.currentUserChannelRelations = {};

    oThis.textIds = [];
    oThis.texts = {};

    oThis.imageIds = [];
    oThis.images = {};

    oThis.tagIds = [];
    oThis.tags = {};
    oThis.links = {};
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
      oThis._fetchCurrentUserChannelRelations(),
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

    // If channel id is not passed and permalink is passed.
    if (!oThis.channelId) {
      let lowercaseChPermalink = oThis.channelPermalink.toLowerCase();
      const cacheResponse = await new ChannelByPermalinksCache({
        permalinks: [lowercaseChPermalink]
      }).fetch();

      if (cacheResponse.isFailure()) {
        return Promise.reject(cacheResponse);
      }

      const permalinkIdsMap = cacheResponse.data;

      if (!CommonValidators.validateNonEmptyObject(permalinkIdsMap[lowercaseChPermalink])) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_c_g_3',
            api_error_identifier: 'entity_not_found',
            debug_options: {
              channelPermalink: oThis.channelPermalink
            }
          })
        );
      }

      oThis.channelId = permalinkIdsMap[lowercaseChPermalink].id;
    }

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

    oThis.tagIds = cacheResponse.data[oThis.channelId];
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
  async _fetchCurrentUserChannelRelations() {
    const oThis = this;
    if (!oThis.currentUser) {
      return;
    }

    const currentUserChannelRelationLibParams = {
      currentUserId: oThis.currentUser.id,
      channelIds: [oThis.channelId]
    };

    const currentUserChannelRelationsResponse = await new GetCurrentUserChannelRelationsLib(
      currentUserChannelRelationLibParams
    ).perform();
    if (currentUserChannelRelationsResponse.isFailure()) {
      return Promise.reject(currentUserChannelRelationsResponse);
    }

    oThis.currentUserChannelRelations = currentUserChannelRelationsResponse.data.currentUserChannelRelations;
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
   * @returns {{images: *, texts: *, channel: *, channelStats: *}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return {
      [entityTypeConstants.channel]: oThis.channel,
      [entityTypeConstants.channelDetailsMap]: { [oThis.channel.id]: oThis.channel },
      [entityTypeConstants.channelIdToTagIdsMap]: { [oThis.channel.id]: oThis.tagIds },
      [entityTypeConstants.channelStatsMap]: oThis.channelStatsMap,
      [entityTypeConstants.currentUserChannelRelationsMap]: oThis.currentUserChannelRelations,
      [entityTypeConstants.textsMap]: oThis.texts,
      linkMap: oThis.links,
      imageMap: oThis.images,
      tags: oThis.tags
    };
  }
}

module.exports = GetChannel;

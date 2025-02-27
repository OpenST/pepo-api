const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 * Class to get list of curated entities.
 *
 * @class GetCuratedList
 */
class GetCuratedList extends ServiceBase {
  /**
   * Constructor to get list of curated entities.
   *
   * @param {object} params
   * @param {string} params.entity_kind
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.entityKind = params.entity_kind;

    oThis.entityKindInt = 0;
    oThis.curatedEntityIds = [];
    oThis.curatedEntityList = [];
    oThis.curatedEntityDetails = {};

    oThis.userByUserIdMap = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.tagsMap = {};
    oThis.channels = {};
    oThis.channelIdToTagIdsMap = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis.validateAndSanitize();

    await oThis.fetchEntityIdsForEntityKind();

    await oThis.fetchAssociatedEntitiesForEntityKind();

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Validate and sanitize input parameters.
   *
   * @sets oThis.entityKindInt
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;

    oThis.entityKindInt = curatedEntitiesConstants.invertedEntityKinds[oThis.entityKind];

    if (!oThis.entityKindInt) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_c_l_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_entity_kind'],
          debug_options: { entity_kind: oThis.entity_kind }
        })
      );
    }
  }

  /**
   * Get curated list for given entity kind.
   *
   * @sets oThis.curatedEntityIds
   *
   * @returns {Promise<*>}
   */
  async fetchEntityIdsForEntityKind() {
    const oThis = this;

    const curatedEntityIdsByKindCacheRsp = await new CuratedEntityIdsByKindCache({
      entityKind: oThis.entityKind
    }).fetch();

    if (!curatedEntityIdsByKindCacheRsp || curatedEntityIdsByKindCacheRsp.isFailure()) {
      return Promise.reject(curatedEntityIdsByKindCacheRsp);
    }

    oThis.curatedEntityIds = curatedEntityIdsByKindCacheRsp.data.entityIds;
    oThis.curatedEntityDetails = curatedEntityIdsByKindCacheRsp.data.entityDetails;
  }

  /**
   * Fetch associated entities according to the entity kind.
   *
   * @returns {Promise<void>}
   */
  async fetchAssociatedEntitiesForEntityKind() {
    const oThis = this;

    if (oThis.entityKind === curatedEntitiesConstants.userEntityKind) {
      const promisesArray = [oThis._fetchUsers(), oThis._fetchTokenUsers()];
      await Promise.all(promisesArray);
      oThis._filterNonActiveUsers();
    } else if (oThis.entityKind === curatedEntitiesConstants.tagsEntityKind) {
      await oThis._fetchTags();
    } else {
      const promisesArray1 = [oThis._fetchChannels(), oThis._fetchChannelTagIds()];
      await Promise.all(promisesArray1);
    }
  }

  /**
   * Fetch token users.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    if (oThis.curatedEntityIds.length === 0) {
      return;
    }

    const userDetailsCacheResponse = await new UserCache({ ids: oThis.curatedEntityIds }).fetch();
    if (!userDetailsCacheResponse || userDetailsCacheResponse.isFailure()) {
      return Promise.reject(userDetailsCacheResponse);
    }

    oThis.userByUserIdMap = userDetailsCacheResponse.data;

    for (let ind = 0; ind < oThis.curatedEntityIds.length; ) {
      const userId = oThis.curatedEntityIds[ind],
        userObj = oThis.userByUserIdMap[userId];
      if (userObj && userObj.status === userConstants.activeStatus) {
        ind++; // Increment only if not deleted
      } else {
        oThis.curatedEntityIds.splice(ind, 1);
        delete oThis.userByUserIdMap[userId];
        delete oThis.tokenUsersByUserIdMap[userId];
      }
    }
  }

  /**
   * Fetch token users.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.curatedEntityIds.length === 0) {
      return;
    }

    const tokenUserDetailByUserIdsCacheRsp = await new TokenUserDetailByUserIdsCache({
      userIds: oThis.curatedEntityIds
    }).fetch();

    if (!tokenUserDetailByUserIdsCacheRsp || tokenUserDetailByUserIdsCacheRsp.isFailure()) {
      return Promise.reject(tokenUserDetailByUserIdsCacheRsp);
    }

    oThis.tokenUsersByUserIdMap = tokenUserDetailByUserIdsCacheRsp.data;
  }

  /**
   * Filter non active users - no platform activation.
   *
   * @private
   */
  _filterNonActiveUsers() {
    const oThis = this;

    for (let ind = 0; ind < oThis.curatedEntityIds.length; ) {
      const userId = oThis.curatedEntityIds[ind];
      if (Object.prototype.hasOwnProperty.call(oThis.tokenUsersByUserIdMap[userId], 'userId')) {
        ind++; // Increment only if not deleted
      } else {
        oThis.curatedEntityIds.splice(ind, 1);
        delete oThis.userByUserIdMap[userId];
        delete oThis.tokenUsersByUserIdMap[userId];
      }
    }
  }

  /**
   * Fetch tags details.
   *
   * @sets oThis.tagsMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTags() {
    const oThis = this;

    const cacheRsp = await new TagByIdCache({ ids: oThis.curatedEntityIds }).fetch();
    if (!cacheRsp || cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.tagsMap = cacheRsp.data;
  }

  /**
   * Fetch Channels details.
   *
   * @sets oThis.channels
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannels() {
    const oThis = this;

    const cacheRsp = await new ChannelByIdsCache({ ids: oThis.curatedEntityIds }).fetch();
    if (!cacheRsp || cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    for (const channelId in cacheRsp.data) {
      const channel = cacheRsp.data[channelId];
      if (channel.status !== channelConstants.activeStatus) {
        continue;
      }

      oThis.channels[channelId] = channel;
    }
  }

  /**
   * Fetch channel tag ids.
   *
   * @sets oThis.channelIdToTagIdsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelTagIds() {
    const oThis = this;

    const cacheResponse = await new ChannelTagByChannelIdsCache({ channelIds: oThis.curatedEntityIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelTagByChannelIdsCacheCacheData = cacheResponse.data;

    for (const channelId in channelTagByChannelIdsCacheCacheData) {
      const channelTags = channelTagByChannelIdsCacheCacheData[channelId];
      oThis.channelIdToTagIdsMap[channelId] = channelTags;
    }
  }

  /**
   * Prepare final response.
   *
   * @returns {*}
   */
  _prepareResponse() {
    const oThis = this;

    for (let index = 0; index < oThis.curatedEntityIds.length; index++) {
      const curatedEntityId = oThis.curatedEntityIds[index];
      oThis.curatedEntityList.push(oThis.curatedEntityDetails[curatedEntityId]);
    }

    if (oThis.entityKind === curatedEntitiesConstants.userEntityKind) {
      return {
        [adminEntityType.usersCuratedEntitiesList]: oThis.curatedEntityList,
        usersByIdMap: oThis.userByUserIdMap,
        tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap
      };
    } else if (oThis.entityKind === curatedEntitiesConstants.tagsEntityKind) {
      return {
        [adminEntityType.tagsCuratedEntitiesList]: oThis.curatedEntityList,
        tags: oThis.tagsMap
      };
    }

    return {
      [adminEntityType.channelsCuratedEntitiesList]: oThis.curatedEntityList,
      [adminEntityType.channelsMap]: oThis.channels,
      [adminEntityType.channelDetailsMap]: oThis.channels,
      [adminEntityType.channelIdToTagIdsMap]: oThis.channelIdToTagIdsMap
    };
  }
}

module.exports = GetCuratedList;

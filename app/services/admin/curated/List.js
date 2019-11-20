const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities');

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

    oThis.userByUserIdMap = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.tagsMap = {};
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

    await oThis._fetchEntityIdsForEntityKind();

    await oThis._fetchAssociatedEntitiesForEntityKind();

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
   * @returns {Promise<*>}
   */
  async _fetchEntityIdsForEntityKind() {
    const oThis = this;

    console.log('oThis.entityKind----', oThis.entityKind);

    const curatedEntityIdsByKindCacheRsp = await new CuratedEntityIdsByKindCache({
      entityKind: oThis.entityKind
    }).fetch();

    if (!curatedEntityIdsByKindCacheRsp || curatedEntityIdsByKindCacheRsp.isFailure()) {
      return Promise.reject(curatedEntityIdsByKindCacheRsp);
    }

    oThis.curatedEntityIds = curatedEntityIdsByKindCacheRsp.data[oThis.entityKind];

    console.log('oThis.curatedEntityIds----', oThis.curatedEntityIds);
  }

  /**
   * Fetch associated entities according to the entity kind.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAssociatedEntitiesForEntityKind() {
    const oThis = this;

    if (oThis.entityKind === curatedEntitiesConstants.userEntityKind) {
      await oThis._fetchUsers();
      await oThis._fetchTokenUsers();
      await oThis._filterNonActiveUsers();
    } else {
      await oThis._fetchTags();
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
   * @return {Promise<void>}
   * @private
   */
  async _filterNonActiveUsers() {
    const oThis = this;

    for (let ind = 0; ind < oThis.curatedEntityIds.length; ) {
      const userId = oThis.curatedEntityIds[ind];
      if (oThis.tokenUsersByUserIdMap[userId].hasOwnProperty('userId')) {
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
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTags() {
    const oThis = this;

    let cacheRsp = await new TagByIdCache({ ids: oThis.curatedEntityIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.tagsMap = cacheRsp.data;
  }

  /**
   * Prepare final response.
   *
   * @returns {*}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    if (oThis.entityKind === curatedEntitiesConstants.userEntityKind) {
      return {
        [oThis.entityKind]: oThis.curatedEntityIds,
        usersByIdMap: oThis.userByUserIdMap,
        tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap
      };
    } else {
      return {
        [oThis.entityKind]: oThis.curatedEntityIds,
        [adminEntityType.tagsMap]: oThis.tagsMap
      };
    }
  }
}

module.exports = GetCuratedList;

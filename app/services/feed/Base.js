const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ExternalEntityByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ExternalEntityByIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity');

/**
 * Base class for feed service.
 *
 * @class FeedBase
 */
class FeedBase extends ServiceBase {
  /**
   * Constructor for feed service base.
   *
   * @param {object} params
   * @param {number/string} [params.limit]
   * @param {string} [params.limit.pagination_identifier]
   *
   * @augments ServiceBase
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.limit = params.limit;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.paginationTimestamp = null;
    oThis.feedIds = [];
    oThis.lastFeedId = null;
    oThis.feedIdToFeedDetailsMap = {};
    oThis.giphyKindExternalEntityIdToFeedIdMap = {};
    oThis.usersByIdMap = {};
    oThis.userIds = [];
    oThis.externalEntityIds = [];
    oThis.ostTransactionMap = {};
    oThis.gifMap = {};
    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: {}
    };
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchFeedDetails();

    oThis._processFeedDetails();

    await oThis._fetchExternalEntities();

    await Promise.all([oThis._fetchUsers(), oThis._fetchTokenUser()]);

    return responseHelper.successWithData(oThis._finalResponse());
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.paginationTimestamp, oThis.limit
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.paginationTimestamp = parsedPaginationParams.paginationTimestamp; // Override paginationTimestamp number.
      oThis.limit = parsedPaginationParams.limit; // Override limit.
    } else {
      oThis.paginationTimestamp = null;
      oThis.limit = oThis.limit || oThis._defaultPageLimit();
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch feed details.
   *
   * @sets oThis.feedIdToFeedDetailsMap, oThis.externalEntityIds, oThis.giphyKindExternalEntityIdToFeedIdMap
   *
   * @returns {result}
   * @private
   */
  _processFeedDetails() {
    const oThis = this;

    oThis.paginationTimestamp = oThis.feedIdToFeedDetailsMap[oThis.lastFeedId].publishedTs;

    for (let index = 0; index < oThis.feedIds.length; index++) {
      const feedId = oThis.feedIds[index];
      const feedDetails = oThis.feedIdToFeedDetailsMap[feedId],
        feedExtraData = feedDetails.extraData;

      oThis.feedIdToFeedDetailsMap[feedId].payload = {
        text: feedExtraData.text,
        ostTransactionId: feedDetails.primaryExternalEntityId
      };

      oThis.giphyKindExternalEntityIdToFeedIdMap[feedExtraData.giphyExternalEntityId] = feedId;

      oThis.externalEntityIds.push(feedDetails.primaryExternalEntityId); // OST transaction ID.
      if (feedExtraData.giphyExternalEntityId) {
        oThis.externalEntityIds.push(feedExtraData.giphyExternalEntityId); // GIF external entity table ID.
      }
    }

    oThis.externalEntityIds = [...new Set(oThis.externalEntityIds)]; // Removes duplication.

    return responseHelper.successWithData({});
  }

  /**
   * Fetch external entities data.
   *
   * @sets  oThis.userIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchExternalEntities() {
    const oThis = this;

    if (oThis.externalEntityIds.length === 0) {
      return responseHelper.successWithData({});
    }

    // Fetch external entity details.
    const cacheResp = await new ExternalEntityByIdsCache({ ids: oThis.externalEntityIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(
        new Error(`Details for some or all of the external entity Ids: ${oThis.externalEntityIds} unavailable.`)
      );
    }

    const externalEntityIdToDetailsMap = cacheResp.data;

    // Loop over external entity ids to ensure data is in order.
    for (
      let externalEntityIdIndex = 0;
      externalEntityIdIndex < oThis.externalEntityIds.length;
      externalEntityIdIndex++
    ) {
      const externalEntityTableId = oThis.externalEntityIds[externalEntityIdIndex];

      // Fetch external entity details.
      const externalEntityDetails = externalEntityIdToDetailsMap[externalEntityTableId];

      const externalEntityExtraData = externalEntityDetails.extraData;
      const externalEntityTableEntityId = externalEntityDetails.entityId;

      if (!externalEntityExtraData) {
        return Promise.reject(new Error('External data for external entity is null'));
      }

      switch (externalEntityDetails.entityKind) {
        case externalEntityConstants.ostTransactionEntityKind: {
          oThis.ostTransactionMap[externalEntityTableId] = {
            id: externalEntityTableId,
            entityId: externalEntityTableEntityId,
            extraData: externalEntityExtraData
          };
          // OST Transaction is mapped with external entity table ID.

          // Fetch users.
          oThis.userIds.push(externalEntityExtraData.fromUserId);
          for (let index = 0; index < externalEntityExtraData.toUserIds.length; index++) {
            oThis.userIds.push(externalEntityExtraData.toUserIds[index]);
          }

          break;
        }
        case externalEntityConstants.giphyEntityKind: {
          oThis.gifMap[externalEntityTableEntityId] = externalEntityExtraData;

          // Insert entityId in feed details payload.
          const feedId = oThis.giphyKindExternalEntityIdToFeedIdMap[externalEntityTableId];
          oThis.feedIdToFeedDetailsMap[feedId].payload.gifDetailId = externalEntityTableEntityId;

          break;
        }
        default: {
          throw new Error('Invalid entity kind.');
        }
      }
    }

    oThis.userIds = [...new Set(oThis.userIds)]; // Removes duplication.

    return responseHelper.successWithData({});
  }

  /**
   * Fetch users from cache.
   *
   * @sets oThis.usersByIdMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheResp = await new UserMultiCache({ ids: oThis.userIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(new Error(`Details for some or all of the user Ids: ${oThis.userIds} unavailable.`));
    }

    oThis.usersByIdMap = cacheResp.data;

    return responseHelper.successWithData({});
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData({});
    }

    const cacheResp = await new TokenUserDetailByUserIdsCache({ userIds: oThis.userIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(
        new Error(`Token user details for some or all of the user Ids: ${oThis.userIds} unavailable.`)
      );
    }

    oThis.tokenUsersByUserIdMap = cacheResp.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Service response.
   *
   * @returns {*|result}
   * @private
   */
  _finalResponse() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.feedIds.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        // TODO - think on how to remove duplicates.
        paginationTimestamp: oThis.paginationTimestamp,

        limit: oThis._currentPageLimit()
      };
    }

    const responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    return {
      feedIds: oThis.feedIds,
      feedIdToFeedDetailsMap: oThis.feedIdToFeedDetailsMap,
      ostTransactionMap: oThis.ostTransactionMap,
      gifMap: oThis.gifMap,
      usersByIdMap: oThis.usersByIdMap,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      meta: responseMetaData
    };
  }

  /**
   * Fetch feed details map.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchFeedDetails() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Default page limit.
   *
   * @private
   */
  _defaultPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Min page limit.
   *
   * @private
   */
  _minPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Max page limit.
   *
   * @private
   */
  _maxPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Current page limit.
   *
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = FeedBase;

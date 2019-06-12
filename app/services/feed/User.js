const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  ExternalEntityByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ExternalEntityByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  externalEntityConstants = require(rootPrefix + '/lib/globalConstant/externalEntity');

/**
 * Class for user feed service.
 *
 * @class UserFeed
 */
class UserFeed extends ServiceBase {
  /**
   * Constructor for user feed service.
   *
   * @param {object} params
   * @param {string} params.current_user
   * @param {number/string} params.limit
   * @param {string} params.limit.pagination_identifier
   *
   * @augments ServiceBase
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.current_user = params.current_user;
    oThis.currentUserId = oThis.current_user.id;
    oThis.limit = params.limit;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.page = null;
    oThis.feedIds = [];
    oThis.feedIdToFeedDetailsMap = {};
    oThis.usersByIdMap = {};
    oThis.userIds = {};
    oThis.externalEntityIds = [];
    oThis.ostTransactionIds = [];
    oThis.giphyTransactionIds = [];
    oThis.externalEntityIdToDetailsMap = {};
    oThis.externalEntityIdsResponseMap = { ost_transactions: {}, gif_details: {} };
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

    await oThis._fetchUserFeedIds();

    if (oThis.feedIds.length === 0) {
      return responseHelper.successWithData(oThis._finalResponse());
    }

    await oThis._fetchFeedDetails();
    await oThis._fetchExternalEntities();
    await oThis._fetchUsers();

    return responseHelper.successWithData(oThis._finalResponse());
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.page, oThis.limit
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.page = parsedPaginationParams.page; // Override page number.
      oThis.limit = parsedPaginationParams.limit; // Override limit.
    } else {
      oThis.page = 1;
      oThis.limit = oThis.limit || paginationConstants.defaultUserFeedPageSize;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch user feed ids.
   *
   * @sets oThis.feedIds
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchUserFeedIds() {
    const oThis = this;

    oThis.feedIds = await new UserFeedModel().fetchFeedIds({
      limit: oThis.limit,
      page: oThis.page,
      userId: oThis.currentUserId
    });

    return responseHelper.successWithData({});
  }

  /**
   * Fetch feed details.
   *
   * @sets oThis.feedIdToFeedDetailsMap, oThis.externalEntityIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchFeedDetails() {
    const oThis = this;

    const feedByIdsCacheRsp = await new FeedByIdsCache({ ids: oThis.feedIds }).fetch();

    if (feedByIdsCacheRsp.isFailure()) {
      return Promise.reject(new Error(`Details for some or all of the feed Ids: ${oThis.feedIds} unavailable.`));
    }

    oThis.feedIdToFeedDetailsMap = feedByIdsCacheRsp.data;

    for (let index = 0; index < oThis.feedIds.length; index++) {
      const feedId = oThis.feedIds[index];
      const feedDetails = oThis.feedIdToFeedDetailsMap[feedId];

      oThis.externalEntityIds.push(feedDetails.primaryExternalEntityId);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch external entities data.
   *
   * @sets oThis.externalEntityIdToDetailsMap, oThis.userIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchExternalEntities() {
    const oThis = this;

    oThis.externalEntityIdToDetailsMap = await new ExternalEntityByIdsCache({ ids: oThis.externalEntityIds }).fetch();

    if (oThis.externalEntityIdToDetailsMap.isFailure()) {
      return Promise.reject(
        new Error(`Details for some or all of the external entity Ids: ${oThis.externalEntityIds} unavailable.`)
      );
    }

    for (
      let externalEntityIdIndex = 0;
      externalEntityIdIndex < oThis.externalEntityIds.length;
      externalEntityIdIndex++
    ) {
      const externalEntityId = oThis.externalEntityIds[externalEntityIdIndex];

      const externalEntityDetails = oThis.externalEntityIdToDetailsMap[externalEntityId];
      const externalEntityExtraData = externalEntityDetails.extraData;

      if (!externalEntityExtraData) {
        return Promise.reject(new Error('External data for external entity is null'));
      }

      switch (externalEntityDetails.entityKind) {
        case externalEntityConstants.ostTransactionEntityKind: {
          oThis.externalEntityIdsResponseMap.ost_transactions[externalEntityDetails.entityId] = externalEntityExtraData;

          oThis.userIds[externalEntityExtraData.from_user_id] = 1;

          for (let index = 0; index < externalEntityExtraData.to_user_ids.length; index++) {
            oThis.userIds[externalEntityExtraData.to_user_ids[index]] = 1;
          }

          break;
        }
        case externalEntityConstants.giphyEntityKind: {
          oThis.externalEntityIdsResponseMap.gif_details[externalEntityDetails.entityId] = externalEntityExtraData;
          break;
        }
        default: {
          throw new Error('Invalid entity kind.');
        }
      }
    }

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

    const cacheResp = await new UserMultiCache({ ids: Object.keys(oThis.userIds) }).fetch();
    oThis.usersByIdMap = cacheResp.data;

    return responseHelper.successWithData({});
  }

  /**
   * Service response.
   *
   * @returns {*|result}
   * @private
   */
  _finalResponse() {
    const oThis = this;

    const nextPagePayloadKey = {
      [paginationConstants.paginationIdentifierKey]: {
        page: oThis.page + 1,
        limit: oThis.limit
      }
    };

    const responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    return {
      feedIds: oThis.feedIds,
      feedIdToFeedDetailsMap: oThis.feedIdToFeedDetailsMap,
      externalEntityDetails: oThis.externalEntityIdsResponseMap,
      usersByIdMap: oThis.usersByIdMap,
      meta: responseMetaData
    };
  }
}

module.exports = UserFeed;

const rootPrefix = '../../..',
  ActivityServiceBase = require(rootPrefix + '/app/services/activity/Base'),
  UserActivityModel = require(rootPrefix + '/app/models/mysql/UserActivity'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ActivityByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ActivityByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for user activity service.
 *
 * @class UserActivity
 */
class UserActivity extends ActivityServiceBase {
  /**
   * Constructor for user activity service.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string/number} params.current_user.id
   * @param {string/number} params.user_id
   * @param {string} [params.pagination_identifier]
   *
   * @augments ActivityServiceBase
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUserId = +params.current_user.id;
    oThis.profileUserId = +params.user_id;

    oThis.isCurrentUser = oThis.currentUserId === oThis.profileUserId;
  }

  /**
   * Validate and sanitize params. This method validates the profileUserId and performs some
   * other validations of base class.
   *
   * @returns {Promise<*|Promise<Promise<never>|*>>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;
    logger.log(`start: _validateAndSanitizeParams`);

    if (!oThis.isCurrentUser) {
      const cacheResp = await new UserCache({ ids: [oThis.profileUserId] }).fetch();

      if (cacheResp.isFailure()) {
        return Promise.reject(cacheResp);
      }

      if (!cacheResp.data[oThis.profileUserId].id) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_a_u_vasp_1',
            api_error_identifier: 'resource_not_found'
          })
        );
      }
    }

    return super._validateAndSanitizeParams();
  }

  /**
   * Fetch user activity details.
   *
   * @sets oThis.activityIds, oThis.activityMap, oThis.userActivityMap
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchActivityDetails() {
    const oThis = this;
    logger.log(`start: _fetchActivityDetails`);

    let modelResp = {};

    const fetchActivityIdsParams = {
      limit: oThis._currentPageLimit(),
      paginationTimestamp: oThis.paginationTimestamp,
      userId: oThis.profileUserId
    };

    if (oThis.isCurrentUser) {
      modelResp = await new UserActivityModel()._currentUserActivityIds(fetchActivityIdsParams);
    } else {
      modelResp = await new UserActivityModel()._otherUserActivityIds(fetchActivityIdsParams);
    }

    oThis.activityIds = modelResp.activityIds;
    oThis.userActivityMap = modelResp.userActivityMap;
    oThis.lastActivityId = oThis.activityIds[oThis.activityIds.length - 1];

    if (oThis.activityIds.length === 0) {
      return responseHelper.successWithData(oThis._finalResponse());
    }

    const cacheResp = await new ActivityByIdsCache({ ids: oThis.activityIds }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.activityMap = cacheResp.data;

    logger.log(`end: _fetchActivityDetails`);
  }

  /**
   * Service response.
   *
   * @returns {*|result}
   * @private
   */
  _finalResponse() {
    const oThis = this;
    logger.log(`start: _finalResponse`);

    const nextPagePayloadKey = {};

    if (oThis.activityIds.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        // TODO - think on how to remove duplicates.
        pagination_timestamp: oThis.paginationTimestamp
      };
    }

    const responseMetaData = {
      profileUserId: oThis.profileUserId,
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    logger.log(`end: _finalResponse`);

    return {
      activityIds: oThis.activityIds,
      userActivityMap: oThis.userActivityMap,
      activityMap: oThis.activityMap,
      ostTransactionMap: oThis.ostTransactionMap,
      externalEntityGifMap: oThis.externalEntityGifMap,
      usersByIdMap: oThis.usersMap,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      meta: responseMetaData
    };
  }

  /**
   * Default page limit.
   *
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultUserActivityPageSize;
  }

  /**
   * Min page limit.
   *
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minUserActivityPageSize;
  }

  /**
   * Max page limit.
   *
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxUserActivityPageSize;
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

module.exports = UserActivity;

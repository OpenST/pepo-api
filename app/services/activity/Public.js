const rootPrefix = '../../..',
  ActivityModel = require(rootPrefix + '/app/models/mysql/Activity'),
  ActivityServiceBase = require(rootPrefix + '/app/services/activity/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for public activity service.
 *
 * @class PublicActivity
 */
class PublicActivity extends ActivityServiceBase {
  /**
   * Fetch activity ids.
   *
   * @sets oThis.activityIds, oThis.activityMap
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchActivityDetails() {
    const oThis = this;
    logger.log(`start: _fetchActivityDetails`);

    const modelResp = await new ActivityModel().fetchPublicPublishedActivityIds({
      paginationTimestamp: oThis.paginationTimestamp,
      limit: oThis._currentPageLimit()
    });

    oThis.activityIds = modelResp.activityIds;
    oThis.activityMap = modelResp.activityMap;
    oThis.lastActivityId = oThis.activityIds[oThis.activityIds.length - 1];

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
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    logger.log(`end: _finalResponse`);

    return {
      activityIds: oThis.activityIds,
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
    return paginationConstants.defaultPublicActivityPageSize;
  }

  /**
   * Min page limit.
   *
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minPublicActivityPageSize;
  }

  /**
   * Max page limit.
   *
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxPublicActivityPageSize;
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

module.exports = PublicActivity;

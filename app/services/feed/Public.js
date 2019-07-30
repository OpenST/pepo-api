const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

class PublicVideoFeed extends FeedBase {
  /**
   * Constructor for Public Video Feed
   *
   * @param params
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.feeds = [];
    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.profileResponse = {};
    oThis.finalResponse = {};

    oThis.limit = oThis._defaultPageLimit();
    oThis.paginationTimestamp = null;
  }

  /**
   * Validate and Sanitize
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.currentUser) {
      oThis.currentUserId = Number(oThis.currentUser.id);
    } else {
      oThis.currentUserId = 0;
    }

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.paginationTimestamp = parsedPaginationParams.pagination_timestamp; // Override paginationTimestamp number.
    } else {
      oThis.paginationTimestamp = null;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Set feed ids
   *
   * @private
   */
  async _setFeedIds() {
    const oThis = this,
      loggedOutFeedCacheResp = await new LoggedOutFeedCache({
        limit: oThis.limit,
        paginationTimestamp: oThis.paginationTimestamp
      }).fetch();

    oThis.feedIds = loggedOutFeedCacheResp.data.feedIds;
    oThis.feedsMap = loggedOutFeedCacheResp.data.feedDetails;

    const lastFeedId = oThis.feedIds[oThis.feedIds.length - 1];

    if (oThis.feedIds.length > 0) {
      oThis.nextPaginationTimestamp = oThis.feedsMap[lastFeedId].paginationIdentifier;
    }
  }

  /**
   * Prepare Response
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.feeds.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_timestamp: oThis.nextPaginationTimestamp
      };
    }

    const responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    if (!oThis.currentUser && oThis.paginationTimestamp == null) {
      let curatedFeed = {
        id: '9999',
        primaryExternalEntityId: '999',
        paginationIdentifier: 1564468241,
        kind: 'CURATED',
        actor: 1000,
        extraData: 'null',
        createdAt: 1564468241,
        updatedAt: 1564468241
      };

      oThis.feeds = [curatedFeed].concat(oThis.feeds);

      oThis.profileResponse.videoMap = Object.assign(oThis.profileResponse.videoMap, {
        '999': {
          id: '999',
          resolutions: {
            original: {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/videos/1045-7dafe24a95fa04399cc68d268f05dda8-original.mp4',
              size: 4573849,
              height: 1280,
              width: 720
            }
          },
          posterImageId: '202',
          status: 'active',
          createdAt: 1564472456,
          updatedAt: 1564472456
        }
      });

      oThis.profileResponse.videoDetailsMap = Object.assign(oThis.profileResponse.videoDetailsMap, {
        '999': {
          id: '999',
          creatorUserId: '1000',
          videoId: '999',
          totalContributedBy: 2,
          totalAmount: '2122000000000000000',
          totalTransactions: 2,
          createdAt: 1564472456,
          updatedAt: 1564472456
        }
      });

      oThis.profileResponse.imageMap = Object.assign(oThis.profileResponse.imageMap, {
        '202': {
          id: '202',
          resolutions: {
            original: {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/images/1072-b5227fd1b2e8a69568d8d8ec4aa31c42-original.jpg'
            },
            '144w': {
              width: 144,
              height: 144,
              size: 6612,
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/images/1072-cee6f2baef2099c404df52f9ac5b8577-144w.jpg'
            }
          },
          status: 'RESIZE_DONE',
          kind: 'PROFILE_IMAGE',
          createdAt: 1564044369,
          updatedAt: 1564044369
        }
      });
    }

    return responseHelper.successWithData({
      feedList: oThis.feeds,
      userProfilesMap: oThis.profileResponse.userProfilesMap,
      userProfileAllowedActions: oThis.profileResponse.userProfileAllowedActions,
      usersByIdMap: oThis.profileResponse.usersByIdMap,
      tokenUsersByUserIdMap: oThis.profileResponse.tokenUsersByUserIdMap,
      imageMap: oThis.profileResponse.imageMap,
      videoMap: oThis.profileResponse.videoMap,
      linkMap: oThis.profileResponse.linkMap,
      tags: oThis.profileResponse.tags,
      userStat: oThis.profileResponse.userStat,
      videoDetailsMap: oThis.profileResponse.videoDetailsMap,
      currentUserUserContributionsMap: oThis.profileResponse.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.profileResponse.currentUserVideoContributionsMap,
      pricePointsMap: oThis.profileResponse.pricePointsMap,
      tokenDetails: oThis.tokenDetails,
      meta: responseMetaData
    });
  }

  _currentPageLimit() {
    return paginationConstants.defaultFeedsListPageSize;
  }

  /**
   * Default page limit.
   *
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultFeedsListPageSize;
  }

  _minPageLimit() {
    return paginationConstants.minFeedsListPageSize;
  }

  _maxPageLimit() {
    return paginationConstants.maxFeedsListPageSize;
  }
}

module.exports = PublicVideoFeed;

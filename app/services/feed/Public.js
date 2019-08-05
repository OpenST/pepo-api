const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for public video feed.
 *
 * @class PublicVideoFeed
 */
class PublicVideoFeed extends FeedBase {
  /**
   * Constructor for public video feed.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string} [params.pagination_identifier]
   *
   * @augments FeedBase
   *
   * @constructor
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
   * Validate and sanitize.
   *
   * @sets oThis.currentUserId, oThis.paginationTimestamp
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
   * Set feed ids.
   *
   * @sets oThis.feedIds, oThis.feedsMap, oThis.nextPaginationTimestamp
   *
   * @returns {Promise<*>}
   * @private
   */
  async _setFeedIds() {
    const oThis = this;

    const loggedOutFeedCacheResp = await new LoggedOutFeedCache({
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
   * Prepare response.
   *
   * @sets oThis.feeds, oThis.profileResponse
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

    // TODO - temp code for curated feeds
    // TEMP CODE START - to show curated feeds on top(only in logged out mode)
    if (!oThis.currentUser && oThis.paginationTimestamp == null) {
      const curatedFeed = {
        id: '9999',
        primaryExternalEntityId: '999',
        paginationIdentifier: 1564468241,
        kind: 'CURATED',
        actor: 9999,
        extraData: 'null',
        createdAt: 1564468241,
        updatedAt: 1564468241
      };

      oThis.feeds = [curatedFeed].concat(oThis.feeds);

      oThis.profileResponse.userProfilesMap = Object.assign(oThis.profileResponse.userProfilesMap, {
        '9999': {
          id: 1000,
          userId: 9999,
          bio: {
            text: 'pepo.com',
            includes: {}
          },
          linkIds: [],
          coverVideoId: '150',
          coverImageId: '289',
          updatedAt: 1564659388
        }
      });

      oThis.profileResponse.usersByIdMap = Object.assign(oThis.profileResponse.usersByIdMap, {
        '9999': {
          id: '9999',
          userName: 'Pepo_Academy',
          name: 'Pepo Academy',
          profileImageId: '292',
          markInactiveTriggerCount: 0,
          properties: 2,
          status: 'ACTIVE',
          createdAt: 1564660482,
          updatedAt: 1564660611
        }
      });

      oThis.profileResponse.tokenUsersByUserIdMap = Object.assign(oThis.profileResponse.tokenUsersByUserIdMap, {
        '9999': {
          id: '9999',
          userId: '9999',
          ostUserId: '20600e85-c420-47c3-97cf-5f712c80b5b6',
          ostTokenHolderAddress: '0xc7a62816475b6d385b36318f4fb4fa90ce114b9e',
          properties: 7,
          ostStatus: 'ACTIVATED',
          createdAt: 1564050302,
          updatedAt: 1564050422
        }
      });

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
          creatorUserId: '9999',
          videoId: '999',
          totalContributedBy: 25,
          totalAmount: '9000122000000000000000',
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

    // TEMP CODE END - to show curated feeds on top(only in logged out mode)

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

  /**
   * Returns current page limit.
   *
   * @returns {number}
   * @private
   */
  _currentPageLimit() {
    return paginationConstants.defaultFeedsListPageSize;
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultFeedsListPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minFeedsListPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxFeedsListPageSize;
  }
}

module.exports = PublicVideoFeed;

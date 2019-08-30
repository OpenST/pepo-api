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
      const curatedFeeds = [
        {
          id: '-1',
          primaryExternalEntityId: '-100',
          paginationIdentifier: 1564468241,
          kind: 'CURATED',
          actor: -999,
          extraData: 'null',
          createdAt: 1564468241,
          updatedAt: 1564468241
        },
        {
          id: '-2',
          primaryExternalEntityId: '-101',
          paginationIdentifier: 1564468241,
          kind: 'CURATED',
          actor: -999,
          extraData: 'null',
          createdAt: 1564468241,
          updatedAt: 1564468241
        },
        {
          id: '-3',
          primaryExternalEntityId: '-102',
          paginationIdentifier: 1564468241,
          kind: 'CURATED',
          actor: -999,
          extraData: 'null',
          createdAt: 1564468241,
          updatedAt: 1564468241
        }
      ];

      oThis.feeds = curatedFeeds.concat(oThis.feeds);

      oThis.profileResponse.userProfilesMap = Object.assign(oThis.profileResponse.userProfilesMap, {
        '-999': {
          id: 1000,
          userId: -999,
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
        '-999': {
          id: '-999',
          userName: 'Pepo_Academy',
          name: 'Pepo Academy',
          profileImageId: '292',
          markInactiveTriggerCount: 0,
          properties: 6,
          status: 'ACTIVE',
          approvedCreator: 1,
          createdAt: 1564660482,
          updatedAt: 1564660611
        }
      });

      oThis.profileResponse.tokenUsersByUserIdMap = Object.assign(oThis.profileResponse.tokenUsersByUserIdMap, {
        '-999': {
          id: '-999',
          userId: '-999',
          ostUserId: '20600e85-c420-47c3-97cf-5f712c80b5b6',
          ostTokenHolderAddress: '0xc7a62816475b6d385b36318f4fb4fa90ce114b9e',
          properties: 7,
          ostStatus: 'ACTIVATED',
          createdAt: 1564050302,
          updatedAt: 1564050422
        }
      });

      oThis.profileResponse.videoMap = Object.assign(oThis.profileResponse.videoMap, {
        '-100': {
          id: '-100',
          resolutions: {
            original: {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/videos/1000-3be05bd1b1bbb4a8559f2932245e70f1-original.mp4',
              size: 4573849,
              height: 1280,
              width: 720
            },
            '576w': {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/videos/1000-3be05bd1b1bbb4a8559f2932245e70f1-576w.mp4',
              size: 1363148,
              height: 1016,
              width: 576
            }
          },
          posterImageId: '-9001',
          status: 'active',
          createdAt: 1564472456,
          updatedAt: 1564472456
        },
        '-101': {
          id: '-101',
          resolutions: {
            original: {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/videos/1000-744eff04466b1b3321b2f5e92527a53d-original.mp4',
              size: 4573849,
              height: 1280,
              width: 720
            },
            '576w': {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/videos/1000-744eff04466b1b3321b2f5e92527a53d-576w.mp4',
              size: 928768,
              height: 1016,
              width: 576
            }
          },
          posterImageId: '-9002',
          status: 'active',
          createdAt: 1564472456,
          updatedAt: 1564472456
        },
        '-102': {
          id: '-102',
          resolutions: {
            original: {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/videos/1000-2da3a523efbab1a3ea5793e62189c35d-original.mp4',
              size: 4573849,
              height: 1280,
              width: 720
            },
            '576w': {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/videos/1000-2da3a523efbab1a3ea5793e62189c35d-576w.mp4',
              size: 1363148,
              height: 1016,
              width: 576
            }
          },
          posterImageId: '-9003',
          status: 'active',
          createdAt: 1564472456,
          updatedAt: 1564472456
        }
      });

      oThis.profileResponse.videoDetailsMap = Object.assign(oThis.profileResponse.videoDetailsMap, {
        '-100': {
          id: '-100',
          creatorUserId: '-999',
          videoId: '-100',
          totalContributedBy: 0,
          totalAmount: '0',
          totalTransactions: 0,
          descriptionId: null,
          linkIds: null,
          createdAt: 1564472456,
          updatedAt: 1564472456
        },
        '-101': {
          id: '-101',
          creatorUserId: '-999',
          videoId: '-100',
          totalContributedBy: 0,
          totalAmount: '0',
          totalTransactions: 0,
          descriptionId: null,
          linkIds: null,
          createdAt: 1564472456,
          updatedAt: 1564472456
        },
        '-102': {
          id: '-102',
          creatorUserId: '-999',
          videoId: '-100',
          totalContributedBy: 0,
          totalAmount: '0',
          totalTransactions: 0,
          descriptionId: null,
          linkIds: null,
          createdAt: 1564472456,
          updatedAt: 1564472456
        }
      });

      oThis.profileResponse.imageMap = Object.assign(oThis.profileResponse.imageMap, {
        '-9001': {
          id: '-9001',
          resolutions: {
            original: {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/images/1000-3be05bd1b1bbb4a8559f2932245e70f1-original.jpg',
              size: 23552
            },
            '288w': {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/images/1000-3be05bd1b1bbb4a8559f2932245e70f1-288w.jpg',
              size: 23552,
              height: 509,
              width: 288
            }
          },
          status: 'RESIZE_DONE',
          kind: 'PROFILE_IMAGE',
          createdAt: 1564044369,
          updatedAt: 1564044369
        },
        '-9002': {
          id: '-9002',
          resolutions: {
            original: {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/images/1000-744eff04466b1b3321b2f5e92527a53d-original.jpg',
              size: 25600
            },
            '288w': {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/images/1000-744eff04466b1b3321b2f5e92527a53d-288w.jpg',
              size: 25600,
              height: 509,
              width: 288
            }
          },
          status: 'RESIZE_DONE',
          kind: 'PROFILE_IMAGE',
          createdAt: 1564044369,
          updatedAt: 1564044369
        },
        '-9003': {
          id: '-9003',
          resolutions: {
            original: {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/images/1000-2da3a523efbab1a3ea5793e62189c35d-original.jpg',
              size: 14336
            },
            '288w': {
              url:
                'https://dbvoeb7t6hffk.cloudfront.net/pepo-sandbox1000/ua/images/1000-2da3a523efbab1a3ea5793e62189c35d-288w.jpg',
              size: 14336,
              height: 509,
              width: 288
            }
          },
          status: 'RESIZE_DONE',
          kind: 'PROFILE_IMAGE',
          createdAt: 1564044369,
          updatedAt: 1564044369
        }
      });

      oThis.profileResponse.videoDescriptions = null;
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
      videoDescriptionsMap: oThis.profileResponse.videoDescriptionMap,
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

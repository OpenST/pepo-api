const rootPrefix = '../..',
  TokenFormatter = require(rootPrefix + '/lib/formatter/strategy/Token'),
  DeviceFormatter = require(rootPrefix + '/lib/formatter/strategy/Device'),
  UrlMapFormatter = require(rootPrefix + '/lib/formatter/strategy/url/Map'),
  GifMapFormatter = require(rootPrefix + '/lib/formatter/strategy/gif/Map'),
  TagMapMetaFormatter = require(rootPrefix + '/lib/formatter/meta/TagList'),
  TagMapFormatter = require(rootPrefix + '/lib/formatter/strategy/tag/Map'),
  TagListFormatter = require(rootPrefix + '/lib/formatter/strategy/tag/List'),
  FeedFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/Single'),
  FeedMapFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/Map'),
  GifListFormatter = require(rootPrefix + '/lib/formatter/strategy/gif/List'),
  UserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/user/Map'),
  UserFormatter = require(rootPrefix + '/lib/formatter/strategy/user/Single'),
  UserListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserList'),
  GifsSearchMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Search'),
  UserFeedMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserFeed'),
  UserListFormatter = require(rootPrefix + '/lib/formatter/strategy/user/List'),
  ImageMapFormatter = require(rootPrefix + '/lib/formatter/strategy/image/Map'),
  VideoMapFormatter = require(rootPrefix + '/lib/formatter/strategy/video/Map'),
  FeedListFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/List'),
  ActivityFormatter = require(rootPrefix + '/lib/formatter/strategy/activity/Single'),
  ActivityMapFormatter = require(rootPrefix + '/lib/formatter/strategy/activity/Map'),
  RecoveryInfoFormatter = require(rootPrefix + '/lib/formatter/strategy/RecoveryInfo'),
  UserStatsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/userStat/Map'),
  UserActivityMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserActivity'),
  ActivityListFormatter = require(rootPrefix + '/lib/formatter/strategy/activity/List'),
  UserFeedListFormatter = require(rootPrefix + '/lib/formatter/strategy/userFeed/List'),
  UserProfileMapFormatter = require(rootPrefix + '/lib/formatter/strategy/userProfile/Map'),
  UserProfileFormatter = require(rootPrefix + '/lib/formatter/strategy/userProfile/Single'),
  PricePointsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/pricePoints/Map'),
  UploadParamsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/uploadParams/Map'),
  VideoDetailsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/videoDetails/Map'),
  WebsocketDetailsFormatter = require(rootPrefix + '/lib/formatter/strategy/WebsocketDetails'),
  GifCategoriesListFormatter = require(rootPrefix + '/lib/formatter/strategy/gifCategory/List'),
  UserActivityListFormatter = require(rootPrefix + '/lib/formatter/strategy/userActivity/List'),
  LoggedInUserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/logged_in_user/Map'),
  LoggedInUserListFormatter = require(rootPrefix + '/lib/formatter/strategy/logged_in_user/List'),
  OstTransactionMapFormatter = require(rootPrefix + '/lib/formatter/strategy/ostTransaction/Map'),
  LoggedInUserSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/logged_in_user/Single'),
  UserProfileAllowedActionsFormatter = require(rootPrefix + '/lib/formatter/strategy/UserProfileAllowedActions'),
  CurrentUserUserContributionsMapFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserUserContributions/Map'),
  CurrentUserVideoContributionsMapFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserVideoContributions/Map'),
  ExternalEntityGifMapFormatter = require(rootPrefix + '/lib/formatter/strategy/gif/ExternalEntityMap'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class for user formatter composer.
 *
 * @class FormatterComposer
 */
class FormatterComposer {
  /**
   * Constructor for user formatter.
   *
   * @param {object} params
   * @param {object} params.resultType
   * @param {object} params.entityKindToResponseKeyMap
   * @param {object} params.serviceData
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.resultType = params.resultType;
    oThis.entityKindToResponseKeyMap = params.entityKindToResponseKeyMap;
    oThis.serviceData = params.serviceData;

    // Add your entity type here with entity formatter class name.
    oThis.entityClassMapping = {
      [entityType.user]: UserFormatter,
      [entityType.recoveryInfo]: RecoveryInfoFormatter,
      [entityType.device]: DeviceFormatter,
      [entityType.token]: TokenFormatter,
      [entityType.users]: UserListFormatter,
      [entityType.usersMap]: UserMapFormatter,
      [entityType.userListMeta]: UserListMetaFormatter,
      [entityType.ostTransactionMap]: OstTransactionMapFormatter,
      [entityType.gifs]: GifListFormatter,
      [entityType.gifsSearchMeta]: GifsSearchMetaFormatter,
      [entityType.gifCategories]: GifCategoriesListFormatter,
      [entityType.gifMap]: GifMapFormatter,
      [entityType.feed]: FeedFormatter,
      [entityType.feedMap]: FeedMapFormatter,
      [entityType.feedList]: FeedListFormatter,
      [entityType.feedListMeta]: UserFeedMetaFormatter,
      [entityType.userFeedList]: UserFeedListFormatter,
      [entityType.activity]: ActivityFormatter,
      [entityType.activityMap]: ActivityMapFormatter,
      [entityType.activityList]: ActivityListFormatter,
      [entityType.activityListMeta]: UserActivityMetaFormatter,
      [entityType.userActivityList]: UserActivityListFormatter,
      [entityType.externalEntityGifMap]: ExternalEntityGifMapFormatter,
      [entityType.uploadParams]: UploadParamsMapFormatter,
      [entityType.userProfilesMap]: UserProfileMapFormatter,
      [entityType.userProfile]: UserProfileFormatter,
      [entityType.imagesMap]: ImageMapFormatter,
      [entityType.videosMap]: VideoMapFormatter,
      [entityType.linksMap]: UrlMapFormatter,
      [entityType.tagList]: TagListFormatter,
      [entityType.tagsMap]: TagMapFormatter,
      [entityType.tagListMeta]: TagMapMetaFormatter,
      [entityType.userProfileAllowedActions]: UserProfileAllowedActionsFormatter,
      [entityType.userStats]: UserStatsMapFormatter,
      [entityType.videoDetailsMap]: VideoDetailsMapFormatter,
      [entityType.currentUserUserContributionsMap]: CurrentUserUserContributionsMapFormatter,
      [entityType.currentUserVideoContributionsMap]: CurrentUserVideoContributionsMapFormatter,
      [entityType.pricePointsMap]: PricePointsMapFormatter,
      [entityType.loggedInUser]: LoggedInUserSingleFormatter,
      [entityType.loggedInUserMap]: LoggedInUserMapFormatter,
      [entityType.loggedInUserList]: LoggedInUserListFormatter,
      [entityType.websocketConnectionPayload]: WebsocketDetailsFormatter
    };

    oThis.formattedData = {};
  }

  /**
   * Perform.
   *
   * @return {{}}
   */
  async perform() {
    const oThis = this;

    await oThis.formatEntities();

    if (oThis.resultType) {
      oThis.formattedData.result_type = oThis.resultType;
    }

    return responseHelper.successWithData(oThis.formattedData);
  }

  /**
   * Format entities.
   *
   * @return {Promise<void>}
   */
  async formatEntities() {
    const oThis = this;

    for (const entity in oThis.entityKindToResponseKeyMap) {
      const entityFormatter = oThis.entityClassMapping[entity];

      const entityFormatterResp = new entityFormatter(oThis.serviceData).perform();

      if (entityFormatterResp.isFailure()) {
        return Promise.reject(entityFormatterResp);
      }

      oThis.formattedData[oThis.entityKindToResponseKeyMap[entity]] = entityFormatterResp.data;
    }
  }
}

module.exports = FormatterComposer;

const rootPrefix = '../..',
  TokenFormatter = require(rootPrefix + '/lib/formatter/strategy/Token'),
  DeviceFormatter = require(rootPrefix + '/lib/formatter/strategy/Device'),
  UrlMapFormatter = require(rootPrefix + '/lib/formatter/strategy/url/Map'),
  GifMapFormatter = require(rootPrefix + '/lib/formatter/strategy/gif/Map'),
  TagMapMetaFormatter = require(rootPrefix + '/lib/formatter/meta/TagList'),
  UserNotificationListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserNotificationList'),
  UserNotificationFormatter = require(rootPrefix + '/lib/formatter/strategy/userNotification/Single'),
  UserNotificationListFormatter = require(rootPrefix + '/lib/formatter/strategy/userNotification/List'),
  UserVideoListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserVideoList'),
  UserSearchMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserSearch'),
  InvitedUsersSearchMetaFormatter = require(rootPrefix + '/lib/formatter/meta/InvitedUsersSearch'),
  InviteUserSearchMetaFormatter = require(rootPrefix + '/lib/formatter/meta/InviteUserSearch'),
  TagMapFormatter = require(rootPrefix + '/lib/formatter/strategy/tag/Map'),
  TagListFormatter = require(rootPrefix + '/lib/formatter/strategy/tag/List'),
  EmailSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/email/Single'),
  FeedFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/Single'),
  BalanceFormatter = require(rootPrefix + '/lib/formatter/strategy/Balance'),
  FeedMapFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/Map'),
  GifListFormatter = require(rootPrefix + '/lib/formatter/strategy/gif/List'),
  UserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/user/Map'),
  AdminUserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/adminUser/Map'),
  TwitterUserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/twitterUser/Map'),
  SecureTwitterUserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/secureTwitterUser/Map'),
  UserFormatter = require(rootPrefix + '/lib/formatter/strategy/user/Single'),
  PaymentReceiptFormatter = require(rootPrefix + '/lib/formatter/strategy/paymentReceipt/Single'),
  UserListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserList'),
  GifsSearchMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Search'),
  UserFeedMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserFeed'),
  UserListFormatter = require(rootPrefix + '/lib/formatter/strategy/user/List'),
  AdminFormatter = require(rootPrefix + '/lib/formatter/strategy/admin/Single'),
  RedemptionInfo = require(rootPrefix + '/lib/formatter/strategy/redemption/Info'),
  Redemption = require(rootPrefix + '/lib/formatter/strategy/redemption/request/Single'),
  ImageMapFormatter = require(rootPrefix + '/lib/formatter/strategy/image/Map'),
  VideoMapFormatter = require(rootPrefix + '/lib/formatter/strategy/video/Map'),
  FeedListFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/List'),
  TopupLimitDataFormatter = require(rootPrefix + '/lib/formatter/strategy/topup/LimitData'),
  TopupProductListFormatter = require(rootPrefix + '/lib/formatter/strategy/topup/product/List'),
  RecoveryInfoFormatter = require(rootPrefix + '/lib/formatter/strategy/RecoveryInfo'),
  UserStatsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/userStat/Map'),
  UserFeedListFormatter = require(rootPrefix + '/lib/formatter/strategy/userFeed/List'),
  UserVideosListFormatter = require(rootPrefix + '/lib/formatter/strategy/userVideos/List'),
  UserProfileMapFormatter = require(rootPrefix + '/lib/formatter/strategy/userProfile/Map'),
  UserProfileFormatter = require(rootPrefix + '/lib/formatter/strategy/userProfile/Single'),
  PricePointsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/pricePoints/Map'),
  UploadParamsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/uploadParams/Map'),
  VideoDetailsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/videoDetails/Map'),
  WebsocketDetailsFormatter = require(rootPrefix + '/lib/formatter/strategy/WebsocketDetails'),
  VideoDescriptionSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/videoDescription/Single'),
  VideoDescriptionMapFormatter = require(rootPrefix + '/lib/formatter/strategy/videoDescription/Map'),
  GifCategoriesListFormatter = require(rootPrefix + '/lib/formatter/strategy/gifCategory/List'),
  UserSearchListFormatter = require(rootPrefix + '/lib/formatter/strategy/userSearch/List'),
  UserTopUpsListFormatter = require(rootPrefix + '/lib/formatter/strategy/userTopUps/List'),
  UserTopUpFormatter = require(rootPrefix + '/lib/formatter/strategy/userTopUps/Single'),
  LoggedInUserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/logged_in_user/Map'),
  LoggedInUserListFormatter = require(rootPrefix + '/lib/formatter/strategy/logged_in_user/List'),
  OstTransactionMapFormatter = require(rootPrefix + '/lib/formatter/strategy/ostTransaction/Map'),
  LoggedInUserSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/logged_in_user/Single'),
  InviteUserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/invites/Map'),
  InviteUserSearchSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/inviteUserSearch/Single'),
  InviteUserSearchListFormatter = require(rootPrefix + '/lib/formatter/strategy/inviteUserSearch/List'),
  UserProfileAllowedActionsFormatter = require(rootPrefix + '/lib/formatter/strategy/UserProfileAllowedActions'),
  UserContributionToStatsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/userContributionToStats/Map'),
  UserContributionByStatsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/userContributionByStats/Map'),
  CurrentUserUserContributionsMapFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserUserContributions/Map'),
  CurrentUserVideoContributionsMapFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserVideoContributions/Map'),
  ExternalEntityGifMapFormatter = require(rootPrefix + '/lib/formatter/strategy/gif/ExternalEntityMap'),
  FetchGotoFormatter = require(rootPrefix + '/lib/formatter/strategy/FetchGoto'),
  shareFormatter = require(rootPrefix + '/lib/formatter/strategy/Share'),
  inviteCodeFormatter = require(rootPrefix + '/lib/formatter/strategy/inviteCode/Single'),
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
      [entityType.adminUsersMap]: AdminUserMapFormatter,
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
      [entityType.userSearchList]: UserSearchListFormatter,
      [entityType.externalEntityGifMap]: ExternalEntityGifMapFormatter,
      [entityType.uploadParams]: UploadParamsMapFormatter,
      [entityType.userProfilesMap]: UserProfileMapFormatter,
      [entityType.userProfile]: UserProfileFormatter,
      [entityType.imagesMap]: ImageMapFormatter,
      [entityType.videosMap]: VideoMapFormatter,
      [entityType.linksMap]: UrlMapFormatter,
      [entityType.tagList]: TagListFormatter,
      [entityType.tagsMap]: TagMapFormatter,
      [entityType.userNotification]: UserNotificationFormatter,
      [entityType.userNotificationList]: UserNotificationListFormatter,
      [entityType.userNotificationListMeta]: UserNotificationListMetaFormatter,
      [entityType.tagListMeta]: TagMapMetaFormatter,
      [entityType.userVideoListMeta]: UserVideoListMetaFormatter,
      [entityType.userSearchMeta]: UserSearchMetaFormatter,
      [entityType.invitedUsersListMeta]: InvitedUsersSearchMetaFormatter,
      [entityType.inviteUserSearchMeta]: InviteUserSearchMetaFormatter,
      [entityType.userProfileAllowedActions]: UserProfileAllowedActionsFormatter,
      [entityType.userStats]: UserStatsMapFormatter,
      [entityType.videoDetailsMap]: VideoDetailsMapFormatter,
      [entityType.currentUserUserContributionsMap]: CurrentUserUserContributionsMapFormatter,
      [entityType.currentUserVideoContributionsMap]: CurrentUserVideoContributionsMapFormatter,
      [entityType.pricePointsMap]: PricePointsMapFormatter,
      [entityType.loggedInUser]: LoggedInUserSingleFormatter,
      [entityType.loggedInUserMap]: LoggedInUserMapFormatter,
      [entityType.loggedInUserList]: LoggedInUserListFormatter,
      [entityType.inviteUserSearch]: InviteUserSearchSingleFormatter,
      [entityType.inviteUserSearchList]: InviteUserSearchListFormatter,
      [entityType.userVideoList]: UserVideosListFormatter,
      [entityType.userContributionToStatsMap]: UserContributionToStatsMapFormatter,
      [entityType.userContributionByStatsMap]: UserContributionByStatsMapFormatter,
      [entityType.websocketConnectionPayload]: WebsocketDetailsFormatter,
      [entityType.products]: TopupProductListFormatter,
      [entityType.paymentReceipt]: PaymentReceiptFormatter,
      [entityType.limitsData]: TopupLimitDataFormatter,
      [entityType.videoDescription]: VideoDescriptionSingleFormatter,
      [entityType.videoDescriptionsMap]: VideoDescriptionMapFormatter,
      [entityType.redemptionInfo]: RedemptionInfo,
      [entityType.redemption]: Redemption,
      [entityType.inviteMap]: InviteUserMapFormatter,
      [entityType.userTopUpsList]: UserTopUpsListFormatter,
      [entityType.userTopUp]: UserTopUpFormatter,
      [entityType.admin]: AdminFormatter,
      [entityType.balance]: BalanceFormatter,
      [entityType.email]: EmailSingleFormatter,
      [entityType.twitterUsersMap]: TwitterUserMapFormatter,
      [entityType.secureTwitterUsersMap]: SecureTwitterUserMapFormatter,
      [entityType.goto]: FetchGotoFormatter,
      [entityType.share]: shareFormatter,
      [entityType.inviteCode]: inviteCodeFormatter
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

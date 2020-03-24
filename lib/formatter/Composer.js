const rootPrefix = '../..',
  TokenFormatter = require(rootPrefix + '/lib/formatter/strategy/Token'),
  DeviceFormatter = require(rootPrefix + '/lib/formatter/strategy/Device'),
  UrlMapFormatter = require(rootPrefix + '/lib/formatter/strategy/url/Map'),
  TagMapMetaFormatter = require(rootPrefix + '/lib/formatter/meta/TagList'),
  ChannelMapMetaFormatter = require(rootPrefix + '/lib/formatter/meta/ChannelList'),
  UserNotificationListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserNotificationList'),
  UserNotificationFormatter = require(rootPrefix + '/lib/formatter/strategy/userNotification/Single'),
  UserNotificationListFormatter = require(rootPrefix + '/lib/formatter/strategy/userNotification/List'),
  UserVideoListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserVideoList'),
  TagVideoListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/TagVideoList'),
  ChannelVideosListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/ChannelVideosList'),
  SearchCategoriesListFormatter = require(rootPrefix + '/lib/formatter/strategy/SearchCategory/List'),
  UserSearchMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserSearch'),
  InvitedUsersSearchMetaFormatter = require(rootPrefix + '/lib/formatter/meta/InvitedUsersSearch'),
  InviteUserSearchMetaFormatter = require(rootPrefix + '/lib/formatter/meta/InviteUserSearch'),
  TagMapFormatter = require(rootPrefix + '/lib/formatter/strategy/tag/Map'),
  InviteCodesMapFormatter = require(rootPrefix + '/lib/formatter/strategy/inviteCode/Map'),
  TagListFormatter = require(rootPrefix + '/lib/formatter/strategy/tag/List'),
  ChannelSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channel/Single'),
  ChannelMapFormatter = require(rootPrefix + '/lib/formatter/strategy/channel/Map'),
  ChannelDetailMapFormatter = require(rootPrefix + '/lib/formatter/strategy/channelDetail/Map'),
  ChannelStatMapFormatter = require(rootPrefix + '/lib/formatter/strategy/channelStat/Map'),
  SupportValidationFormatter = require(rootPrefix + '/lib/formatter/strategy/SupportValidation'),
  RedemptionsProductListFormatter = require(rootPrefix + '/lib/formatter/strategy/RedemptionsProductList'),
  RedirectUrlFormatter = require(rootPrefix + '/lib/formatter/strategy/RedirectUrl'),
  CurrentUserChannelRelationMapFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserChannelRelation/Map'),
  ChannelAllowedActionsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/channelAllowedActions/Map'),
  ChannelUserRelationMapFormatter = require(rootPrefix + '/lib/formatter/strategy/channelUserRelation/Map'),
  StartZoomMeetingPayloadFormatter = require(rootPrefix + '/lib/formatter/strategy/StartZoomMeetingPayload'),
  ChannelListFormatter = require(rootPrefix + '/lib/formatter/strategy/channel/List'),
  TextMapFormatter = require(rootPrefix + '/lib/formatter/strategy/text/Map'),
  SessionAuthPayloadSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/sessionAuthPayload/Single'),
  TagSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/tag/Single'),
  EmailSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/email/Single'),
  FeedFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/Single'),
  BalanceFormatter = require(rootPrefix + '/lib/formatter/strategy/Balance'),
  FeedMapFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/Map'),
  UserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/user/Map'),
  TwitterUserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/twitterUser/Map'),
  UserFormatter = require(rootPrefix + '/lib/formatter/strategy/user/Single'),
  UserListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserList'),
  UserFeedMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserFeed'),
  UserListFormatter = require(rootPrefix + '/lib/formatter/strategy/user/List'),
  RedemptionInfo = require(rootPrefix + '/lib/formatter/strategy/redemption/Info'),
  SupportInfo = require(rootPrefix + '/lib/formatter/strategy/support/Info'),
  Redemption = require(rootPrefix + '/lib/formatter/strategy/redemption/request/Single'),
  ImageMapFormatter = require(rootPrefix + '/lib/formatter/strategy/image/Map'),
  VideoMapFormatter = require(rootPrefix + '/lib/formatter/strategy/video/Map'),
  FeedListFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/List'),
  RecoveryInfoFormatter = require(rootPrefix + '/lib/formatter/strategy/RecoveryInfo'),
  UserStatsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/userStat/Map'),
  UserFeedListFormatter = require(rootPrefix + '/lib/formatter/strategy/userFeed/List'),
  UserVideosListFormatter = require(rootPrefix + '/lib/formatter/strategy/userVideos/List'),
  ChannelVideosListFormatter = require(rootPrefix + '/lib/formatter/strategy/channelVideos/List'),
  VideoRepliesListFormatter = require(rootPrefix + '/lib/formatter/strategy/videoReplies/List'),
  UserRepliesListFormatter = require(rootPrefix + '/lib/formatter/strategy/userReplies/List'),
  UserProfileMapFormatter = require(rootPrefix + '/lib/formatter/strategy/userProfile/Map'),
  UserProfileFormatter = require(rootPrefix + '/lib/formatter/strategy/userProfile/Single'),
  PricePointsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/pricePoints/Map'),
  UploadParamsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/uploadParams/Map'),
  VideoDetailsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/videoDetails/Map'),
  ReplyDetailsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/replyDetails/Map'),
  WebsocketDetailsFormatter = require(rootPrefix + '/lib/formatter/strategy/WebsocketDetails'),
  VideoDescriptionSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/videoDescription/Single'),
  VideoDescriptionMapFormatter = require(rootPrefix + '/lib/formatter/strategy/videoDescription/Map'),
  UserSearchListFormatter = require(rootPrefix + '/lib/formatter/strategy/userSearch/List'),
  ChannelSearchListFormatter = require(rootPrefix + '/lib/formatter/strategy/channelSearch/List'),
  TopupListFormatter = require(rootPrefix + '/lib/formatter/strategy/topup/List'),
  TopUpFormatter = require(rootPrefix + '/lib/formatter/strategy/topup/Single'),
  PepocornBalanceSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/pepocornBalance/Single'),
  PepocornTopUpSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/pepocornTopUp/Single'),
  TopupLimitDataFormatter = require(rootPrefix + '/lib/formatter/strategy/topup/LimitData'),
  TopupProductListFormatter = require(rootPrefix + '/lib/formatter/strategy/topup/product/List'),
  OstTransactionMapFormatter = require(rootPrefix + '/lib/formatter/strategy/ostTransaction/Map'),
  LoggedInUserSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/logged_in_user/Single'),
  AirdropDetailsFormatter = require(rootPrefix + '/lib/formatter/strategy/AirdropDetails'),
  UtmParamsSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/utmParams/Single.js'),
  InviteUserMapFormatter = require(rootPrefix + '/lib/formatter/strategy/invites/Map'),
  TwitterConnectMetaSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/twitterConnectMeta/Single'),
  UnseenRepliesListFormatter = require(rootPrefix + '/lib/formatter/strategy/UnseenReplies'),
  InviteUserSearchSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/inviteUserSearch/Single'),
  InviteUserSearchListFormatter = require(rootPrefix + '/lib/formatter/strategy/inviteUserSearch/List'),
  UserAllowedActionsFormatter = require(rootPrefix + '/lib/formatter/strategy/userAllowedActions/Map'),
  UserContributionToStatsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/userContributionToStats/Map'),
  UserContributionByStatsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/userContributionByStats/Map'),
  CurrentUserUserContributionsMapFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserUserContributions/Map'),
  CurrentUserVideoContributionsMapFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserVideoContributions/Map'),
  CurrentUserReplyDetailContributionsMapFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserReplyDetailContribution/Map'),
  CurrentUserVideoRelationsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/currentUserVideoRelations/Map'),
  CurrentUserReplyDetailRelationsMapFormatter = require(rootPrefix +
    '/lib/formatter/strategy/currentUserReplyDetailRelations/Map'),
  FetchGotoFormatter = require(rootPrefix + '/lib/formatter/strategy/FetchGoto'),
  shareFormatter = require(rootPrefix + '/lib/formatter/strategy/Share'),
  inviteCodeFormatter = require(rootPrefix + '/lib/formatter/strategy/inviteCode/Single'),
  VideoMergeJobFormatter = require(rootPrefix + '/lib/formatter/strategy/videoMergeJob/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

// Declare constants.
// Add your entity type here with entity formatter class name.
const entityClassMapping = {
  [entityTypeConstants.user]: UserFormatter,
  [entityTypeConstants.recoveryInfo]: RecoveryInfoFormatter,
  [entityTypeConstants.device]: DeviceFormatter,
  [entityTypeConstants.token]: TokenFormatter,
  [entityTypeConstants.users]: UserListFormatter,
  [entityTypeConstants.usersMap]: UserMapFormatter,
  [entityTypeConstants.userListMeta]: UserListMetaFormatter,
  [entityTypeConstants.ostTransactionMap]: OstTransactionMapFormatter,
  [entityTypeConstants.feed]: FeedFormatter,
  [entityTypeConstants.feedMap]: FeedMapFormatter,
  [entityTypeConstants.feedList]: FeedListFormatter,
  [entityTypeConstants.feedListMeta]: UserFeedMetaFormatter,
  [entityTypeConstants.userFeedList]: UserFeedListFormatter,
  [entityTypeConstants.userSearchList]: UserSearchListFormatter,
  [entityTypeConstants.channelSearchList]: ChannelSearchListFormatter,
  [entityTypeConstants.uploadParams]: UploadParamsMapFormatter,
  [entityTypeConstants.userProfilesMap]: UserProfileMapFormatter,
  [entityTypeConstants.userProfile]: UserProfileFormatter,
  [entityTypeConstants.imagesMap]: ImageMapFormatter,
  [entityTypeConstants.videosMap]: VideoMapFormatter,
  [entityTypeConstants.linksMap]: UrlMapFormatter,
  [entityTypeConstants.tagList]: TagListFormatter,
  [entityTypeConstants.channelList]: ChannelListFormatter,
  [entityTypeConstants.tagsMap]: TagMapFormatter,
  [entityTypeConstants.tag]: TagSingleFormatter,
  [entityTypeConstants.sessionAuthPayload]: SessionAuthPayloadSingleFormatter,
  [entityTypeConstants.inviteCodesMap]: InviteCodesMapFormatter,
  [entityTypeConstants.userNotification]: UserNotificationFormatter,
  [entityTypeConstants.userNotificationList]: UserNotificationListFormatter,
  [entityTypeConstants.userNotificationListMeta]: UserNotificationListMetaFormatter,
  [entityTypeConstants.tagListMeta]: TagMapMetaFormatter,
  [entityTypeConstants.channelListMeta]: ChannelMapMetaFormatter,
  [entityTypeConstants.userVideoListMeta]: UserVideoListMetaFormatter,
  [entityTypeConstants.tagVideoListMeta]: TagVideoListMetaFormatter,
  [entityTypeConstants.channelVideosListMeta]: ChannelVideosListMetaFormatter,
  [entityTypeConstants.searchCategoriesList]: SearchCategoriesListFormatter,
  [entityTypeConstants.userSearchMeta]: UserSearchMetaFormatter,
  [entityTypeConstants.invitedUsersListMeta]: InvitedUsersSearchMetaFormatter,
  [entityTypeConstants.inviteUserSearchMeta]: InviteUserSearchMetaFormatter,
  [entityTypeConstants.userProfileAllowedActions]: UserAllowedActionsFormatter,
  [entityTypeConstants.userStats]: UserStatsMapFormatter,
  [entityTypeConstants.videoDetailsMap]: VideoDetailsMapFormatter,
  [entityTypeConstants.replyDetailsMap]: ReplyDetailsMapFormatter,
  [entityTypeConstants.currentUserUserContributionsMap]: CurrentUserUserContributionsMapFormatter,
  [entityTypeConstants.currentUserVideoContributionsMap]: CurrentUserVideoContributionsMapFormatter,
  [entityTypeConstants.currentUserReplyDetailContributionsMap]: CurrentUserReplyDetailContributionsMapFormatter,
  [entityTypeConstants.currentUserVideoRelationsMap]: CurrentUserVideoRelationsMapFormatter,
  [entityTypeConstants.currentUserReplyDetailsRelationsMap]: CurrentUserReplyDetailRelationsMapFormatter,
  [entityTypeConstants.pricePointsMap]: PricePointsMapFormatter,
  [entityTypeConstants.loggedInUser]: LoggedInUserSingleFormatter,
  [entityTypeConstants.airdropDetails]: AirdropDetailsFormatter,
  [entityTypeConstants.utmParams]: UtmParamsSingleFormatter,
  [entityTypeConstants.startZoomMeetingPayload]: StartZoomMeetingPayloadFormatter,
  [entityTypeConstants.channel]: ChannelSingleFormatter,
  [entityTypeConstants.channelsMap]: ChannelMapFormatter,
  [entityTypeConstants.channelDetailsMap]: ChannelDetailMapFormatter,
  [entityTypeConstants.channelStatsMap]: ChannelStatMapFormatter,
  [entityTypeConstants.currentUserChannelRelationsMap]: CurrentUserChannelRelationMapFormatter,
  [entityTypeConstants.channelAllowedActionsMap]: ChannelAllowedActionsMapFormatter,
  [entityTypeConstants.channelUserRelationMap]: ChannelUserRelationMapFormatter,
  [entityTypeConstants.inviteUserSearch]: InviteUserSearchSingleFormatter,
  [entityTypeConstants.inviteUserSearchList]: InviteUserSearchListFormatter,
  [entityTypeConstants.userVideoList]: UserVideosListFormatter,
  [entityTypeConstants.videoReplyList]: VideoRepliesListFormatter,
  [entityTypeConstants.userReplyList]: UserRepliesListFormatter,
  [entityTypeConstants.tagVideoList]: UserVideosListFormatter,
  [entityTypeConstants.channelVideoList]: ChannelVideosListFormatter,
  [entityTypeConstants.channelUserList]: UserMapFormatter,
  [entityTypeConstants.textsMap]: TextMapFormatter,
  [entityTypeConstants.userContributionToStatsMap]: UserContributionToStatsMapFormatter,
  [entityTypeConstants.userContributionByStatsMap]: UserContributionByStatsMapFormatter,
  [entityTypeConstants.websocketConnectionPayload]: WebsocketDetailsFormatter,
  [entityTypeConstants.topupProducts]: TopupProductListFormatter,
  [entityTypeConstants.topupLimitsData]: TopupLimitDataFormatter,
  [entityTypeConstants.topupList]: TopupListFormatter,
  [entityTypeConstants.topup]: TopUpFormatter,
  [entityTypeConstants.videoDescription]: VideoDescriptionSingleFormatter,
  [entityTypeConstants.videoDescriptionsMap]: VideoDescriptionMapFormatter,
  [entityTypeConstants.redemptionInfo]: RedemptionInfo,
  [entityTypeConstants.supportInfo]: SupportInfo,
  [entityTypeConstants.redemption]: Redemption,
  [entityTypeConstants.inviteMap]: InviteUserMapFormatter,
  [entityTypeConstants.balance]: BalanceFormatter,
  [entityTypeConstants.email]: EmailSingleFormatter,
  [entityTypeConstants.twitterUsersMap]: TwitterUserMapFormatter,
  [entityTypeConstants.goto]: FetchGotoFormatter,
  [entityTypeConstants.share]: shareFormatter,
  [entityTypeConstants.inviteCode]: inviteCodeFormatter,
  [entityTypeConstants.videoMergeJob]: VideoMergeJobFormatter,
  [entityTypeConstants.pepocornBalance]: PepocornBalanceSingleFormatter,
  [entityTypeConstants.pepocornTopupInfo]: PepocornTopUpSingleFormatter,
  [entityTypeConstants.twitterConnectMeta]: TwitterConnectMetaSingleFormatter,
  [entityTypeConstants.unseenReplies]: UnseenRepliesListFormatter,
  [entityTypeConstants.supportValidation]: SupportValidationFormatter,
  [entityTypeConstants.redemptionsProductList]: RedemptionsProductListFormatter,
  [entityTypeConstants.redirectUrl]: RedirectUrlFormatter
};

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

    oThis.formattedData = {};
  }

  /**
   * Perform.
   *
   * @returns {{}}
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
   * @returns {Promise<void>}
   */
  async formatEntities() {
    const oThis = this;

    for (const entity in oThis.entityKindToResponseKeyMap) {
      const entityFormatter = entityClassMapping[entity];

      const entityFormatterResp = await new entityFormatter(oThis.serviceData).perform();

      if (entityFormatterResp.isFailure()) {
        return Promise.reject(entityFormatterResp);
      }

      oThis.formattedData[oThis.entityKindToResponseKeyMap[entity]] = entityFormatterResp.data;
    }
  }
}

module.exports = FormatterComposer;

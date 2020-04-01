const rootPrefix = '../..',
  UserSearchListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/userSearch/List'),
  UploadParamsMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/uploadParams/Map'),
  UserMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/user/Map'),
  GlobalUserMuteDetailsMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/globalUserMuteDetail/Map'),
  ImageMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/image/Map'),
  UserSearchMetaFormatter = require(rootPrefix + '/lib/formatter/adminMeta/UserSearch'),
  VideoMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/video/Map'),
  UserVideosListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/userVideos/List'),
  UrlMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/url/Map'),
  TokenFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/Token'),
  AdminTwitterUserMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/adminTwitterUser/Map'),
  InviteCodesMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/inviteCode/Map'),
  VideoDetailsMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/videoDetails/Map'),
  UserStatsMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/userStat/Map'),
  UserProfileMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/userProfile/Map'),
  TagMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/tag/Map'),
  TagListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/tag/List'),
  ChannelSearchListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/channelSearch/List'),
  ChannelMetaFormatter = require(rootPrefix + '/lib/formatter/adminMeta/ChannelList'),
  TagListMetaFormatter = require(rootPrefix + '/lib/formatter/adminMeta/TagList'),
  ReplyDetailsMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/replyDetails/Map'),
  PricePointsMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/pricePoints/Map'),
  UserVideoListMetaFormatter = require(rootPrefix + '/lib/formatter/adminMeta/UserVideoList'),
  AdminFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/admin/Single'),
  InviteUserSearchListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/inviteUserSearch/List'),
  InviteUserMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/invites/Map'),
  VideoDescriptionMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/videoDescription/Map'),
  InviteUserSearchMetaFormatter = require(rootPrefix + '/lib/formatter/adminMeta/InviteUserSearch'),
  UserProfileFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/userProfile/Single'),
  UserBalanceSingleFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/userBalance/Single'),
  VideoRepliesListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/videoReplies/List'),
  ChannelMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/channel/Map'),
  ChannelDetailMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/channelDetail/Map'),
  ChannelStatMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/channelStat/Map'),
  CurrentUserChannelRelationMapFormatter = require(rootPrefix +
    '/lib/formatter/adminStrategy/currentUserChannelRelation/Map'),
  TextMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/text/Map'),
  UserCuratedEntityListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/curatedEntity/User'),
  TagCuratedEntityListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/curatedEntity/Tag'),
  ChannelCuratedEntityListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/curatedEntity/Channel'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType');

// Declare constants.
// Add your entity type here with entity formatter class name.
const entityClassMapping = {
  [adminEntityType.userSearchList]: UserSearchListFormatter,
  [adminEntityType.adminUsersMap]: UserMapFormatter,
  [adminEntityType.globalUserMuteDetailsMap]: GlobalUserMuteDetailsMapFormatter,
  [adminEntityType.userStats]: UserStatsMapFormatter,
  [adminEntityType.imagesMap]: ImageMapFormatter,
  [adminEntityType.videosMap]: VideoMapFormatter,
  [adminEntityType.linksMap]: UrlMapFormatter,
  [adminEntityType.adminTwitterUsersMap]: AdminTwitterUserMapFormatter,
  [adminEntityType.token]: TokenFormatter,
  [adminEntityType.inviteCodesMap]: InviteCodesMapFormatter,
  [adminEntityType.userSearchMeta]: UserSearchMetaFormatter,
  [adminEntityType.userVideoList]: UserVideosListFormatter,
  [adminEntityType.userProfilesMap]: UserProfileMapFormatter,
  [adminEntityType.tagsMap]: TagMapFormatter,
  [adminEntityType.videoDetailsMap]: VideoDetailsMapFormatter,
  [adminEntityType.pricePointsMap]: PricePointsMapFormatter,
  [adminEntityType.userVideoListMeta]: UserVideoListMetaFormatter,
  [adminEntityType.admin]: AdminFormatter,
  [adminEntityType.userProfile]: UserProfileFormatter,
  [adminEntityType.inviteUserSearchList]: InviteUserSearchListFormatter,
  [adminEntityType.inviteMap]: InviteUserMapFormatter,
  [adminEntityType.inviteUserSearchMeta]: InviteUserSearchMetaFormatter,
  [adminEntityType.videoDescriptionsMap]: VideoDescriptionMapFormatter,
  [adminEntityType.userBalance]: UserBalanceSingleFormatter,
  [adminEntityType.tagList]: TagListFormatter,
  [adminEntityType.channelSearchList]: ChannelSearchListFormatter,
  [adminEntityType.channelStatsMap]: ChannelStatMapFormatter,
  [adminEntityType.textsMap]: TextMapFormatter,
  [adminEntityType.currentUserChannelRelationsMap]: CurrentUserChannelRelationMapFormatter,
  [adminEntityType.channelListMeta]: ChannelMetaFormatter,
  [adminEntityType.tagListMeta]: TagListMetaFormatter,
  [adminEntityType.replyDetailsMap]: ReplyDetailsMapFormatter,
  [adminEntityType.videoReplyList]: VideoRepliesListFormatter,
  [adminEntityType.channelsMap]: ChannelMapFormatter,
  [adminEntityType.channelDetailsMap]: ChannelDetailMapFormatter,
  [adminEntityType.usersCuratedEntitiesList]: UserCuratedEntityListFormatter,
  [adminEntityType.tagsCuratedEntitiesList]: TagCuratedEntityListFormatter,
  [adminEntityType.channelsCuratedEntitiesList]: ChannelCuratedEntityListFormatter,
  [adminEntityType.channelUploadParamsMap]: UploadParamsMapFormatter
};

/**
 * Class for user formatter composer.
 *
 * @class AdminFormatterComposer
 */
class AdminFormatterComposer {
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

module.exports = AdminFormatterComposer;

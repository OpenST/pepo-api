const rootPrefix = '../..',
  UserSearchListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/userSearch/List'),
  UserMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/user/Map'),
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
  TagListMetaFormatter = require(rootPrefix + '/lib/formatter/adminMeta/TagList'),
  CurrentUserUserContributionsMapFormatter = require(rootPrefix +
    '/lib/formatter/adminStrategy/currentUserUserContributions/Map'),
  CurrentUserVideoContributionsMapFormatter = require(rootPrefix +
    '/lib/formatter/adminStrategy/currentUserVideoContributions/Map'),
  PricePointsMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/pricePoints/Map'),
  UserVideoListMetaFormatter = require(rootPrefix + '/lib/formatter/adminMeta/UserVideoList'),
  AdminFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/admin/Single'),
  InviteUserSearchListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/inviteUserSearch/List'),
  InviteUserMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/invites/Map'),
  VideoDescriptionMapFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/videoDescription/Map'),
  InviteUserSearchMetaFormatter = require(rootPrefix + '/lib/formatter/adminMeta/InviteUserSearch'),
  UserProfileFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/userProfile/Single'),
  UserBalanceSingleFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/userBalance/Single'),
  UserCuratedEntityListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/curatedEntity/User'),
  TagCuratedEntityListFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/curatedEntity/Tag'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType');

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

    // Add your entity type here with entity formatter class name.
    oThis.entityClassMapping = {
      [adminEntityType.userSearchList]: UserSearchListFormatter,
      [adminEntityType.adminUsersMap]: UserMapFormatter,
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
      [adminEntityType.currentUserUserContributionsMap]: CurrentUserUserContributionsMapFormatter,
      [adminEntityType.currentUserVideoContributionsMap]: CurrentUserVideoContributionsMapFormatter,
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
      [adminEntityType.tagListMeta]: TagListMetaFormatter,
      [adminEntityType.usersCuratedEntitiesList]: UserCuratedEntityListFormatter,
      [adminEntityType.tagsCuratedEntitiesList]: TagCuratedEntityListFormatter
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

module.exports = AdminFormatterComposer;

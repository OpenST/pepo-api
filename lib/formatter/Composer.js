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
  UserFeedMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserFeed'),
  GifsSearchMetaFormatter = require(rootPrefix + '/lib/formatter/meta/Search'),
  FeedListFormatter = require(rootPrefix + '/lib/formatter/strategy/feed/List'),
  UserListFormatter = require(rootPrefix + '/lib/formatter/strategy/user/List'),
  ImageMapFormatter = require(rootPrefix + '/lib/formatter/strategy/image/Map'),
  VideoMapFormatter = require(rootPrefix + '/lib/formatter/strategy/video/Map'),
  UserProfileFormatter = require(rootPrefix + '/lib/formatter/strategy/UserProfile'),
  RecoveryInfoFormatter = require(rootPrefix + '/lib/formatter/strategy/RecoveryInfo'),
  UserFeedListFormatter = require(rootPrefix + '/lib/formatter/strategy/userFeed/List'),
  UploadParamsMapFormatter = require(rootPrefix + '/lib/formatter/strategy/uploadParams/Map'),
  GifCategoriesListFormatter = require(rootPrefix + '/lib/formatter/strategy/gifCategory/List'),
  OstTransactionMapFormatter = require(rootPrefix + '/lib/formatter/strategy/ostTransaction/Map'),
  ExternalEntityGifMapFormatter = require(rootPrefix + '/lib/formatter/strategy/gif/ExternalEntityMap'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class for user formatter.
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
      [entityType.feedListMeta]: UserFeedMetaFormatter,
      [entityType.ostTransactionMap]: OstTransactionMapFormatter,
      [entityType.gifs]: GifListFormatter,
      [entityType.gifsSearchMeta]: GifsSearchMetaFormatter,
      [entityType.gifCategories]: GifCategoriesListFormatter,
      [entityType.gifMap]: GifMapFormatter,
      [entityType.feed]: FeedFormatter,
      [entityType.feedMap]: FeedMapFormatter,
      [entityType.feedList]: FeedListFormatter,
      [entityType.externalEntityGifMap]: ExternalEntityGifMapFormatter,
      [entityType.userFeedList]: UserFeedListFormatter,
      [entityType.uploadParams]: UploadParamsMapFormatter,
      [entityType.userProfile]: UserProfileFormatter,
      [entityType.imagesMap]: ImageMapFormatter,
      [entityType.videosMap]: VideoMapFormatter,
      [entityType.linksMap]: UrlMapFormatter,
      [entityType.tagList]: TagListFormatter,
      [entityType.tagsMap]: TagMapFormatter,
      [entityType.tagListMeta]: TagMapMetaFormatter
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

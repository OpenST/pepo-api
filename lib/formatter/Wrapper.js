/**
 * Formatter for user entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/Wrapper
 */

const rootPrefix = '../..',
  TokenFormatter = require(rootPrefix + '/lib/formatter/entity/Token'),
  DeviceFormatter = require(rootPrefix + '/lib/formatter/entity/Device'),
  GifMapFormatter = require(rootPrefix + '/lib/formatter/entity/gif/Map'),
  FeedFormatter = require(rootPrefix + '/lib/formatter/entity/feed/Single'),
  FeedMapFormatter = require(rootPrefix + '/lib/formatter/entity/feed/Map'),
  GifListFormatter = require(rootPrefix + '/lib/formatter/entity/gif/List'),
  UserMapFormatter = require(rootPrefix + '/lib/formatter/entity/user/Map'),
  UserFormatter = require(rootPrefix + '/lib/formatter/entity/user/Single'),
  FeedListFormatter = require(rootPrefix + '/lib/formatter/entity/feed/List'),
  UserListFormatter = require(rootPrefix + '/lib/formatter/entity/user/List'),
  UserListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserList'),
  RecoveryInfoFormatter = require(rootPrefix + '/lib/formatter/entity/RecoveryInfo'),
  GifCategoriesFormatter = require(rootPrefix + '/lib/formatter/entity/GifCategories'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class for user formatter.
 *
 * @class WrapperFormatter
 */
class WrapperFormatter {
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
      [entityType.feedListMeta]: UserListMetaFormatter,
      [entityType.gifs]: GifListFormatter,
      [entityType.gifCategories]: GifCategoriesFormatter,
      [entityType.gifMap]: GifMapFormatter,
      [entityType.feed]: FeedFormatter,
      [entityType.feedMap]: FeedMapFormatter,
      [entityType.feedList]: FeedListFormatter
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

    const entities = Object.keys(oThis.entityKindToResponseKeyMap);

    for (let index = 0; index < entities.length; index++) {
      const entity = entities[index];

      const entityFormatter = oThis.entityClassMapping[entity];

      const entityFormatterResp = new entityFormatter(oThis.serviceData).perform();
      oThis.formattedData[oThis.entityKindToResponseKeyMap[entity]] = entityFormatterResp.data;
    }
  }
}

module.exports = WrapperFormatter;

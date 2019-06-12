/**
 * Formatter for user entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/Wrapper
 */

const rootPrefix = '../..',
  UserFormatter = require(rootPrefix + '/lib/formatter/entity/User'),
  UsersFormatter = require(rootPrefix + '/lib/formatter/entity/Users'),
  RecoveryInfoFormatter = require(rootPrefix + '/lib/formatter/entity/RecoveryInfo'),
  DeviceFormatter = require(rootPrefix + '/lib/formatter/entity/Device'),
  TokenFormatter = require(rootPrefix + '/lib/formatter/entity/Token'),
  GifListFormatter = require(rootPrefix + '/lib/formatter/entity/gif/List'),
  GifCategoriesFormatter = require(rootPrefix + '/lib/formatter/entity/GifCategories'),
  GifMapFormatter = require(rootPrefix + '/lib/formatter/entity/gif/Map'),
  UserListMetaFormatter = require(rootPrefix + '/lib/formatter/meta/UserList'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  TransactionFormatter = require(rootPrefix + '/lib/formatter/entity/Transaction'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user formatter.
 *
 * @class
 */
class WrapperFormatter {
  /**
   * Constructor for user formatter.
   *
   * @param {Object} params
   * @param {Object} params.resultType
   * @param {Object} params.entityKindToResponseKeyMap
   * @param {Object} params.serviceData
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.resultType = params.resultType;
    oThis.entityKindToResponseKeyMap = params.entityKindToResponseKeyMap;
    oThis.serviceData = params.serviceData;

    // add your entity type here with entity formatter class name
    oThis.entityClassMapping = {
      [entityType.user]: UserFormatter,
      [entityType.recoveryInfo]: RecoveryInfoFormatter,
      [entityType.device]: DeviceFormatter,
      [entityType.token]: TokenFormatter,
      [entityType.users]: UsersFormatter,
      [entityType.userListMeta]: UserListMetaFormatter,
      [entityType.gifs]: GifListFormatter,
      [entityType.gifCategories]: GifCategoriesFormatter,
      [entityType.gifMap]: GifMapFormatter,
      [entityType.ostTransaction]: TransactionFormatter
    };

    oThis.formattedData = {};
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  async perform() {
    const oThis = this;

    await oThis.formatEntities();

    if (oThis.resultType) {
      oThis.formattedData['result_type'] = oThis.resultType;
    }

    return responseHelper.successWithData(oThis.formattedData);
  }

  /**
   * format Entities
   *
   * @return {Promise<void>}
   */
  async formatEntities() {
    const oThis = this;

    let entities = Object.keys(oThis.entityKindToResponseKeyMap);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];

      let entityFormatter = oThis.entityClassMapping[entity];

      let entityFormatterResp = new entityFormatter(oThis.serviceData).perform();
      oThis.formattedData[oThis.entityKindToResponseKeyMap[entity]] = entityFormatterResp.data;
    }
  }
}

module.exports = WrapperFormatter;

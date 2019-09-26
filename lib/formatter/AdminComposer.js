const rootPrefix = '../..',
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
      [adminEntityType.user]: ''
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

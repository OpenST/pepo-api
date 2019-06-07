/**
 * Formatter for user entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/Wrapper
 */

const rootPrefix = '../..',
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  LoggedInUserFormatter = require(rootPrefix + '/lib/formatter/entity/LoggedInUser'),
  RecoveryInfoFormatter = require(rootPrefix + '/lib/formatter/entity/RecoveryInfo'),
  DeviceFormatter = require(rootPrefix + '/lib/formatter/entity/Device'),
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
   * @param {Object} params.entities
   * @param {Object} params.serviceData
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.resultType = params.resultType;
    oThis.entities = params.entities;
    oThis.serviceData = params.serviceData;

    oThis.entityClassMapping = {
      [entityType.loggedInUser]: LoggedInUserFormatter,
      [entityType.recoveryInfo]: RecoveryInfoFormatter,
      [entityType.device]: DeviceFormatter
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

    for (let i = 0; i < oThis.entities.length; ++i) {
      const entity = oThis.entities[i];

      let entityFormatter = oThis.entityClassMapping[entity];

      let entityFormatterResp = await new entityFormatter(oThis.serviceData).perform();
      oThis.formattedData[entity] = entityFormatterResp.data;
    }
  }
}

module.exports = WrapperFormatter;

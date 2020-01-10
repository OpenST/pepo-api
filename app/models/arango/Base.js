const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  util = require(rootPrefix + '/lib/util'),
  arangoClient = require(rootPrefix + '/lib/arangoWrapper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for models base.
 *
 * @class ModelBase
 */
class ModelBase {
  /**
   * Constructor for models base.
   *
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;
  }

  /**
   * Connection pool to use for write query.
   *
   * @return {*}
   */
  onWriteConnection() {
    return arangoClient;
  }

  /**
   * Fire the query.
   *
   * @return {Promise<any>}
   */
  query(query, bindVars, options = {}) {
    const oThis = this;

    return oThis.onWriteConnection().query(query, bindVars, options);
  }

  /**
   * Format final DB data.
   *
   * @param {object} formattedData
   *
   * @returns {object}
   */
  sanitizeFormattedData(formattedData) {
    const finalResponse = {};

    for (const key in formattedData) {
      if (!CommonValidators.isVarUndefined(formattedData[key])) {
        finalResponse[key] = formattedData[key];
      }
    }

    return finalResponse;
  }
}

module.exports = ModelBase;

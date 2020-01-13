const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  arangoClient = require(rootPrefix + '/lib/arangoWrapper'),
  arangoConstants = require(rootPrefix + '/lib/globalConstant/arango'),
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
   * Connection pool to use for vertex collection query.
   *
   * @return {*}
   */
  onVertexConnection() {
    const oThis = this;

    const graph = oThis.onSocialGraphConnection();
    return graph.vertexCollection(oThis.collectionName);
  }

  /**
   * Connection pool to use for graph query.
   *
   * @return {*}
   */
  onSocialGraphConnection() {
    const oThis = this;

    const db = oThis.onWriteConnection();

    return db.graph(arangoConstants.socialGraphName);
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

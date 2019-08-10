const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  cassandraClient = require(rootPrefix + '/lib/cassandraWrapper');

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
   * @param {string} params.keyspace
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.keyspace = params.keyspace;
  }

  /**
   * Connection pool to use for read query.
   *
   * @returns {*}
   */
  onReadConnection() {
    /*
    At present, following is not being used. But when we implement read-write Distribution,
    following connection pool will be used for slave connections.
     */
    return cassandraClient;
  }

  /**
   * Connection pool to use for write query.
   *
   * @returns {*}
   */
  onWriteConnection() {
    return cassandraClient;
  }

  /**
   * Table name with keyspace.
   *
   * @returns {*}
   */
  get queryTableName() {
    const oThis = this;

    return `${oThis.keyspace}.${oThis.tableName}`;
  }

  /**
   * Fire the query.
   *
   * @returns {Promise<any>}
   */
  async fire(query, params, options = { prepare: true }) {
    const oThis = this;
    params = params || [];

    return oThis.onWriteConnection().execute(query, params, options);
  }

  /**
   * Batch fire the query.
   *
   * @returns {Promise<any>}
   */
  async batchFire(query, params, options = {}) {
    const oThis = this;
    params = params || [];

    return oThis.onWriteConnection().batch(query, params, options);
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

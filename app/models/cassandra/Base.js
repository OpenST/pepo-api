const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  cassandraClient = require(rootPrefix + '/lib/cassandraWrapper'),
  cassandraConstants = require(rootPrefix + '/lib/globalConstant/cassandra/cassandra');

/**
 * Class for cassandra model base.
 *
 * @class ModelBase
 */
class ModelBase {
  /**
   * Constructor for cassandra model base.
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
   * @returns {string}
   */
  get queryTableName() {
    const oThis = this;

    return `${oThis.keyspace}.${oThis.tableName}`;
  }

  /**
   * Get default options.
   *
   * @param {object} options
   *
   * @returns {*}
   */
  getDefaultOptions(options = {}) {
    options.prepare = options.prepare || true;
    options.consistency = options.consistency || cassandraConstants.defaultConsistencyLevel;

    return options;
  }

  /**
   * Fire the query.
   *
   * @param {string} query
   * @param {array} [params]
   * @param {object} [options]
   *
   * @returns {Promise<any>}
   */
  async fire(query, params = [], options = {}) {
    const oThis = this;

    return oThis.onWriteConnection().execute(query, params, oThis.getDefaultOptions(options));
  }

  /**
   * Batch fire the query.
   *
   * @param {string} query
   * @param {array} [params]
   * @param {object} [options]
   *
   * @returns {Promise<any>}
   */
  async batchFire(query, params = [], options = {}) {
    const oThis = this;

    return oThis.onWriteConnection().batch(query, params, oThis.getDefaultOptions(options));
  }

  /**
   * Batch fire the query.
   *
   * @param {string} query
   * @param {array} [params]
   * @param {object} [options]
   * @param {object} [rowCallback]
   * @param {object} [endCallback]
   *
   * @returns {Promise<any>}
   */
  async eachRow(query, params = [], options = {}, rowCallback, endCallback) {
    const oThis = this;

    return oThis.onWriteConnection().eachRow(query, params, oThis.getDefaultOptions(options), rowCallback, endCallback);
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

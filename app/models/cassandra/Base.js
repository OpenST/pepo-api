const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  cassandraClient = require(rootPrefix + '/lib/cassandraWrapper'),
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
   * @return {*}
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
   * @return {*}
   */
  onWriteConnection() {
    return cassandraClient;
  }

  /**
   * Fire the query.
   *
   * @return {Promise<any>}
   */
  async fire(query, params, options = {}) {
    const oThis = this;

    // todo: print query and time in mili seconds here @tejas discuss this with @aman
    return oThis.onWriteConnection().execute(query, params, options);
  }

  /**
   * Bulk insert query
   *
   * @param query
   * @param inputParams
   * @returns {Promise<void>}
   */
  async bulkInsert(query, inputParams) {
    const batchSize = 25,
      promisesArray = [];

    while (inputParams.length) {
      const toBeProcessedParams = inputParams.splice(0, batchSize);
      const queries = [];

      for (let index = 0; index < toBeProcessedParams.length; index++) {
        const queryObj = {
          query: query,
          params: toBeProcessedParams[index]
        };
        queries.push(queryObj);
      }

      promisesArray.push(cassandraClient.batch(queries));
    }

    await Promise.all(promisesArray);
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

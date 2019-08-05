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
  fire(query, params, options = {}) {
    const oThis = this;

    return new Promise(function(onResolve, onReject) {
      const preQuery = Date.now();
      const qry = oThis.onWriteConnection().execute(query, params, options, function(err, result) {
        logger.info('(' + (Date.now() - preQuery) + ' ms)', qry.sql);
        if (err) {
          onReject(err);
        } else {
          onResolve(result);
        }
      });
    });
  }
}

module.exports = ModelBase;

const rootPrefix = '..',
  CassandraClient = require(rootPrefix + '/lib/cassandraWrapper'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for executing cassandra query.
 *
 * @class ExecuteCassandraQuery
 */
class ExecuteCassandraQuery {
  /**
   * Constructor for executing cassandra query.
   *
   * @param {string} keySpace
   * @param {string} cassandraQuery
   *
   * @constructor
   */
  constructor(keySpace, cassandraQuery) {
    const oThis = this;

    oThis.keySpace = keySpace;
    oThis.cassandraQuery = cassandraQuery;
  }

  /**
   * Perform.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const params = {};

    // Create DB if not present
    if (basicHelper.isDevelopment()) {
      const dbCreationStatement =
        'CREATE KEYSPACE IF NOT EXISTS ' +
        oThis.keySpace +
        ' WITH replication ={' +
        "'class'" +
        ":'" +
        coreConstants.CASSANDRA_REPLICATION_CLASS +
        "'," +
        "'replication_factor'" +
        ":'" +
        coreConstants.CASSANDRA_REPLICATION_FACTOR +
        "'};";

      logger.log(dbCreationStatement);

      await CassandraClient.execute(dbCreationStatement, params, { prepare: true });
    }

    // Execute the cassandra query.
    const queryResult = await CassandraClient.execute(oThis.cassandraQuery, params, { prepare: true });
    logger.log(oThis.cassandraQuery);

    return queryResult;
  }
}

module.exports = ExecuteCassandraQuery;

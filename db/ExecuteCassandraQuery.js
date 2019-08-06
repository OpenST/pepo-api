const rootPrefix = '..',
  CassandraClient = require(rootPrefix + '/lib/cassandraWrapper'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class ExecuteCassandraQuery {
  /**
   * Constructor
   *
   * @param keySpace
   * @param cassandraQuery
   */
  constructor(keySpace, cassandraQuery) {
    const oThis = this;

    oThis.keySpace = keySpace;
    oThis.cassandraQuery = cassandraQuery;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;
    let params = {};

    // Create DB if not present

    let dbCreationStatement =
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

    await CassandraClient.execute(dbCreationStatement, params);

    // Execute the cassandra query
    let queryResult = await CassandraClient.execute(oThis.cassandraQuery, params);
    logger.log(oThis.cassandraQuery);

    return queryResult;
  }
}

module.exports = ExecuteCassandraQuery;

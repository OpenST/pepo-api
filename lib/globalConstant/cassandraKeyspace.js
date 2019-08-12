const rootPrefix = '../..',
  coreConstant = require(rootPrefix + '/config/coreConstants');

const keyspaceNamePrefix = 'pepo_api',
  dbNameSuffix = '_' + coreConstant.environment;

/**
 * Cassandra database constants.
 *
 * @class Database
 */
class Database {
  // Cassandra keyspace start.
  get cassandraKeyspaceName() {
    return keyspaceNamePrefix + dbNameSuffix;
  }
  // Cassandra keyspace end.
}

module.exports = new Database();

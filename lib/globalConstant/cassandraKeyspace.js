const rootPrefix = '../..',
  coreConstant = require(rootPrefix + '/config/coreConstants');

const keyspaceNamePrefix = 'pepo_api',
  dbNameSuffix = '_' + coreConstant.environment;

/**
 * Class for cassandra keyspace constants.
 *
 * @class CassandraKeyspace
 */
class CassandraKeyspace {
  // Cassandra keyspace start.
  get cassandraKeyspaceName() {
    return keyspaceNamePrefix + dbNameSuffix;
  }
  // Cassandra keyspace end.
}

module.exports = new CassandraKeyspace();

const rootPrefix = '../..',
  coreConstant = require(rootPrefix + '/config/coreConstants');

const keyspaceNamePrefix = 'pepo_api',
  dbNameSuffix = '_' + coreConstant.environment;

class Database {
  constructor() {}

  // Cassandra Keyspace start

  get cassandraKeyspaceName() {
    return keyspaceNamePrefix + dbNameSuffix;
  }
  // Cassandra Keyspace end
}

module.exports = new Database();

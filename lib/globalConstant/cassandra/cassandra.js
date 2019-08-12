const CassandraClient = require('cassandra-driver');

// Declare variables.
let defaultConsistencyInteger = null;
/**
 * Class for cassandra constants.
 *
 * @class CassandraConstants
 */
class CassandraConstants {
  get defaultConsistencyLevel() {
    defaultConsistencyInteger = defaultConsistencyInteger
      ? defaultConsistencyInteger
      : CassandraClient.valueOf().types.consistencies.quorum;

    return defaultConsistencyInteger;
  }
}

module.exports = new CassandraConstants();

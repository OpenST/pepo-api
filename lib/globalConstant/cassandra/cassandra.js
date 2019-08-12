const CassandraClient = require('cassandra-driver');

const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

// Declare variables.
let defaultConsistencyInteger = null;
/**
 * Class for cassandra constants.
 *
 * @class CassandraConstants
 */
class CassandraConstants {
  get defaultConsistencyLevel() {
    if (basicHelper.isDevelopment()) {
      defaultConsistencyInteger = defaultConsistencyInteger
        ? defaultConsistencyInteger
        : CassandraClient.valueOf().types.consistencies.localOne;
    } else if (basicHelper.isStaging()) {
      defaultConsistencyInteger = defaultConsistencyInteger
        ? defaultConsistencyInteger
        : CassandraClient.valueOf().types.consistencies.quorum;
    }

    return defaultConsistencyInteger;
  }
}

module.exports = new CassandraConstants();

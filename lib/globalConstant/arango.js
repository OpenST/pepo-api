const rootPrefix = '../..',
  coreConstant = require(rootPrefix + '/config/coreConstants');

// Declare variables.
const dbNamePrefix = 'pepo_api',
  dbNameSuffix = '_' + coreConstant.environment;

/**
 * Class for database constants.
 *
 * @class Database
 */
class Database {
  // arango databases start.
  get mainDbName() {
    return dbNamePrefix + dbNameSuffix;
  }

  get socialGraphName() {
    return 'socialGraph';
  }

  // arango databases end.
}

module.exports = new Database();

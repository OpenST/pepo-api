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
  // MySQL databases start.
  get mainDbName() {
    return dbNamePrefix + dbNameSuffix;
  }

  get userDbName() {
    return dbNamePrefix + '_user' + dbNameSuffix;
  }

  get bigDbName() {
    return dbNamePrefix + '_big' + dbNameSuffix;
  }

  get entityDbName() {
    return dbNamePrefix + '_entity' + dbNameSuffix;
  }

  get twitterDbName() {
    return dbNamePrefix + '_twitter' + dbNameSuffix;
  }

  get feedDbName() {
    return dbNamePrefix + '_feed' + dbNameSuffix;
  }

  get configDbName() {
    return dbNamePrefix + '_config' + dbNameSuffix;
  }

  get ostDbName() {
    return dbNamePrefix + '_ost' + dbNameSuffix;
  }

  get infraDbName() {
    return coreConstant.INFRA_DB_MYSQL_DB;
  }

  get adminDbName() {
    return dbNamePrefix + '_admin' + dbNameSuffix;
  }

  get redemptionDbName() {
    return dbNamePrefix + '_redemption' + dbNameSuffix;
  }

  get socketDbName() {
    return dbNamePrefix + '_socket' + dbNameSuffix;
  }

  get fiatDbName() {
    return dbNamePrefix + '_fiat' + dbNameSuffix;
  }

  get webhookDbName() {
    return dbNamePrefix + '_webhook' + dbNameSuffix;
  }

  // MySQL databases end.
}

module.exports = new Database();

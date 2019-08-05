const rootPrefix = '../..',
  coreConstant = require(rootPrefix + '/config/coreConstants');

const dbNamePrefix = 'pepo_api',
  dbNameSuffix = '_' + coreConstant.environment;

class Database {
  constructor() {}

  // MySQL database start
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

  get socketDbName() {
    return dbNamePrefix + '_socket' + dbNameSuffix;
  }
  // MySQL database end
}

module.exports = new Database();

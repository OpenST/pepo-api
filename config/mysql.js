const rootPrefix = '..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const mysqlConfig = {
  commonNodeConfig: {
    connectionLimit: coreConstants.MYSQL_CONNECTION_POOL_SIZE,
    charset: 'UTF8_UNICODE_CI',
    bigNumberStrings: true,
    supportBigNumbers: true,
    dateStrings: true,
    debug: false
  },
  commonClusterConfig: {
    canRetry: true,
    removeNodeErrorCount: 5,
    restoreNodeTimeout: 10000,
    defaultSelector: 'RR'
  },
  clusters: {
    cluster1: {
      master: {
        host: coreConstants.MYSQL_HOST,
        user: coreConstants.MYSQL_USER,
        password: coreConstants.MYSQL_PASSWORD
      }
    }
  },
  databases: {}
};

// pa database
mysqlConfig['databases']['pepo_api_' + coreConstants.environment] = ['cluster1'];

module.exports = mysqlConfig;

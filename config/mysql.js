const rootPrefix = '..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const mysqlConfig = {
  commonNodeConfig: {
    connectionLimit: coreConstants.MYSQL_CONNECTION_POOL_SIZE,
    charset: 'utf8mb4',
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
    },
    cluster2: {
      master: {
        host: coreConstants.INFRA_MYSQL_HOST,
        user: coreConstants.INFRA_MYSQL_USER,
        password: coreConstants.INFRA_MYSQL_PASSWORD
      }
    },
    cluster3: {
      master: {
        host: coreConstants.CONFIG_ENV_MYSQL_HOST,
        user: coreConstants.CONFIG_ENV_MYSQL_USER,
        password: coreConstants.CONFIG_ENV_MYSQL_PASSWORD
      }
    }
  },
  databases: {}
};

// Pepo API database.
mysqlConfig.databases['pepo_api_' + coreConstants.environment] = ['cluster1'];

// Infra database.
mysqlConfig.databases[coreConstants.INFRA_MYSQL_DB] = ['cluster2'];

// Config database.
mysqlConfig.databases['pepo_api_config_' + coreConstants.environment] = ['cluster3'];

module.exports = mysqlConfig;

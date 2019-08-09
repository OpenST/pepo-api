const rootPrefix = '..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  database = require(rootPrefix + '/lib/globalConstant/database');

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
    mainDbCluster: {
      master: {
        host: coreConstants.MAIN_DB_MYSQL_HOST,
        user: coreConstants.MAIN_DB_MYSQL_USER,
        password: coreConstants.MAIN_DB_MYSQL_PASSWORD
      }
    },
    userDbCluster: {
      master: {
        host: coreConstants.USER_DB_MYSQL_HOST,
        user: coreConstants.USER_DB_MYSQL_USER,
        password: coreConstants.USER_DB_MYSQL_PASSWORD
      }
    },
    bigDbCluster: {
      master: {
        host: coreConstants.BIG_DB_MYSQL_HOST,
        user: coreConstants.BIG_DB_MYSQL_USER,
        password: coreConstants.BIG_DB_MYSQL_PASSWORD
      }
    },
    entityDbCluster: {
      master: {
        host: coreConstants.ENTITY_DB_MYSQL_HOST,
        user: coreConstants.ENTITY_DB_MYSQL_USER,
        password: coreConstants.ENTITY_DB_MYSQL_PASSWORD
      }
    },
    twitterDbCluster: {
      master: {
        host: coreConstants.TWITTER_DB_MYSQL_HOST,
        user: coreConstants.TWITTER_DB_MYSQL_USER,
        password: coreConstants.TWITTER_DB_MYSQL_PASSWORD
      }
    },
    feedDbCluster: {
      master: {
        host: coreConstants.FEED_DB_MYSQL_HOST,
        user: coreConstants.FEED_DB_MYSQL_USER,
        password: coreConstants.FEED_DB_MYSQL_PASSWORD
      }
    },
    configDbCluster: {
      master: {
        host: coreConstants.CONFIG_DB_MYSQL_HOST,
        user: coreConstants.CONFIG_DB_MYSQL_USER,
        password: coreConstants.CONFIG_DB_MYSQL_PASSWORD
      }
    },
    ostDbCluster: {
      master: {
        host: coreConstants.OST_DB_MYSQL_HOST,
        user: coreConstants.OST_DB_MYSQL_USER,
        password: coreConstants.OST_DB_MYSQL_PASSWORD
      }
    },
    infraDbCluster: {
      master: {
        host: coreConstants.INFRA_DB_MYSQL_HOST,
        user: coreConstants.INFRA_DB_MYSQL_USER,
        password: coreConstants.INFRA_DB_MYSQL_PASSWORD
      }
    },
    adminDbCluster: {
      master: {
        host: coreConstants.ADMIN_DB_MYSQL_HOST,
        user: coreConstants.ADMIN_DB_MYSQL_USER,
        password: coreConstants.ADMIN_DB_MYSQL_PASSWORD
      }
    }
  },
  databases: {}
};

// Main db
mysqlConfig.databases[database.mainDbName] = ['mainDbCluster'];

// User db
mysqlConfig.databases[database.userDbName] = ['userDbCluster'];

// Big db
mysqlConfig.databases[database.bigDbName] = ['bigDbCluster'];

// Entity db
mysqlConfig.databases[database.entityDbName] = ['entityDbCluster'];

// Twitter db
mysqlConfig.databases[database.twitterDbName] = ['twitterDbCluster'];

// Feed db
mysqlConfig.databases[database.feedDbName] = ['feedDbCluster'];

// Config db
mysqlConfig.databases[database.configDbName] = ['configDbCluster'];

// Ost db
mysqlConfig.databases[database.ostDbName] = ['ostDbCluster'];

// Ost db
mysqlConfig.databases[database.adminDbName] = ['adminDbCluster'];

// Infra db
mysqlConfig.databases[database.infraDbName] = ['infraDbCluster'];

module.exports = mysqlConfig;

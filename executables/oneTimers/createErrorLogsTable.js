/**
 * Module for creating error_logs table.
 *
 * @module executables/oneTimers/createErrorLogsTable
 */

const mysql = require('mysql');

const rootPrefix = '../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const mysqlHost = coreConstants.INFRA_DB_MYSQL_HOST,
  mysqlUser = coreConstants.INFRA_DB_MYSQL_USER,
  mysqlPassword = coreConstants.INFRA_DB_MYSQL_PASSWORD,
  ostInfraDBName = coreConstants.INFRA_DB_MYSQL_DB;

class CreateErrorLogsTable {
  constructor() {}

  async perform() {
    const oThis = this;

    await oThis._createOstInfraDatabase();

    await oThis._createErrorLogsTable();
  }

  async _createOstInfraDatabase() {
    // Declare mysql connection.
    const createDBConnectionObj = mysql.createConnection({
      host: mysqlHost,
      user: mysqlUser,
      password: mysqlPassword
    });

    // Create DB if not present
    let createResult = await new Promise(function(onResolve, onReject) {
      let dbCreationSql =
        'CREATE DATABASE IF NOT EXISTS ' + ostInfraDBName + ' DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;';

      createDBConnectionObj.query(dbCreationSql, function(err) {
        if (err) {
          logger.error('Error in DB creation: ' + err);
          onReject(err);
        }

        onResolve();
      });
    });

    // End the connection
    await new Promise(function(onResolve, onReject) {
      createDBConnectionObj.end(function(err) {
        if (err) {
          throw err;
        }

        logger.log(`database created successfully.`);
        onResolve();
      });
    });

    return createResult;
  }

  async _createErrorLogsTable() {
    // Declare mysql connection.
    const createTableConnectionObj = await mysql.createConnection({
      host: mysqlHost,
      user: mysqlUser,
      password: mysqlPassword,
      database: ostInfraDBName
    });

    // Create DB if not present
    let createTableResult = await new Promise(function(onResolve, onReject) {
      const createErrorLogsQuery = `CREATE TABLE \`error_logs\` (
                                \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
                                \`app\` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
                                \`env_id\` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
                                \`severity\` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
                                \`machine_ip\` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
                                \`kind\` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
                                \`data\` text,
                                \`status\` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
                                \`retry_count\` int(11) DEFAULT '0',
                                \`created_at\` DATETIME NOT NULL,
                                \`updated_at\` DATETIME NOT NULL,
                                PRIMARY KEY (\`id\`),
                                KEY \`index_1\` (\`severity\`,\`status\`)
                              ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;`;

      createTableConnectionObj.query(createErrorLogsQuery, function(err) {
        if (err) {
          logger.error('Error in DB creation: ' + err);
          onReject(err);
        }

        onResolve();
      });
    });

    // End the connection
    await new Promise(function(onResolve, onReject) {
      createTableConnectionObj.end(function(err) {
        if (err) {
          throw err;
        }

        logger.log(`Table created successfully.`);
        onResolve();
      });
    });

    return createTableResult;
  }
}

new CreateErrorLogsTable().perform();

const rootPrefix = '..',
  ExecuteQuery = require(rootPrefix + '/db/ExecuteQuery'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const schemaMigrationQuery =
  'CREATE TABLE IF NOT EXISTS `schema_migrations` ' +
  '(`version` varchar(255) COLLATE utf8mb4_general_ci NOT NULL, ' +
  'PRIMARY KEY (`version`)' +
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;';

new ExecuteQuery(dbName, schemaMigrationQuery).perform();

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const upQuery = 'ALTER TABLE `token_users` DROP `encryption_salt`;';

const downQuery = 'select 1;';

const migrationName = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = migrationName;

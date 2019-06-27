const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const upQuery =
  'ALTER TABLE `users` \n\
      ADD COLUMN `cookie_token` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL AFTER `password`;';

const downQuery = 'ALTER TABLE `users` DROP `cookie_token`;';

const migrationName = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = migrationName;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.userDbName;

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

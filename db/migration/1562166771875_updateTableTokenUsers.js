const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.userDbName;

const upQuery = 'ALTER TABLE `token_users` DROP `encryption_salt`;';

const downQuery = 'ALTER TABLE `token_users`\n\
  ADD COLUMN `encryption_salt` blob NOT NULL;';

const migrationName = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = migrationName;

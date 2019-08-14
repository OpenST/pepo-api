const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.twitterDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `twitter_users` \n\
      ADD UNIQUE KEY `uk_user_id` (`user_id`);';

const downQuery = 'ALTER TABLE `twitter_users` DROP INDEX `uk_user_id`;';

const addIndexInTwitterUser = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addIndexInTwitterUser;

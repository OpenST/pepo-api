const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.twitterDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `twitter_users` \n\
      ADD COLUMN `handle` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL AFTER `email`; ';

const downQuery = 'ALTER TABLE `twitter_users` DROP `handle`;';

const addColumnHandleInTwitterUser = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnHandleInTwitterUser;

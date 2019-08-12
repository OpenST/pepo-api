const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `users` \n\
      ADD COLUMN `first_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL AFTER `user_name`, \n\
      ADD COLUMN `last_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL AFTER `first_name`;';

const downQuery = 'ALTER TABLE `users` DROP `first_name`,DROP `last_name`;';

const addFirstNameLastNameInUsers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addFirstNameLastNameInUsers;

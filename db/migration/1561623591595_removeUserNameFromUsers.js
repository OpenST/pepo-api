const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `users` DROP `user_name`;';

const downQuery =
  'ALTER TABLE `users` \n\
      ADD COLUMN `user_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci';

const removeUserNameFromUsers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = removeUserNameFromUsers;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `users` \n\
      ADD COLUMN `external_user_id` varchar(50) AFTER `email`; ';

const downQuery = 'ALTER TABLE `users` DROP `external_user_id`;';

const addColumnExternalUserIdInUsersTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnExternalUserIdInUsersTable;

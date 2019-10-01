const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `users` \n\
      ADD COLUMN `external_user_id` varchar(50) NULL AFTER `properties`; ';

const downQuery = 'ALTER TABLE `users` DROP `external_user_id`;';

const addColumnExternalUserIdInUsers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnExternalUserIdInUsers;

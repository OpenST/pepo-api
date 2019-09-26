const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `users` \n\
      MODIFY `external_user_id` varchar(50) NOT NULL; ';

const downQuery = 'ALTER TABLE `users` \n\
  MODIFY `external_user_id` varchar(50) NULL;';

const modifyColumnExternalUserIdInUsers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = modifyColumnExternalUserIdInUsers;

const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.userDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'ALTER TABLE `users` \n\
      ADD COLUMN `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL,\n\
      ADD UNIQUE  `uk_idx_2` (`email`);';

const downQuery = 'ALTER TABLE `users` \n\
      DROP `email`,\n\
      DROP INDEX `uk_idx_2`;';

const addEmailIdColumnInUsersTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addEmailIdColumnInUsersTable;

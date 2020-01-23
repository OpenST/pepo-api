const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `user_identifiers` ADD UNIQUE INDEX `uidx_2` (`e_value`);';

const downQuery = 'ALTER TABLE `user_identifiers` DROP INDEX `uidx_2`;';

const addUniqIndexInUserIdentifiers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addUniqIndexInUserIdentifiers;

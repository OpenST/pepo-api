const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.meetingDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'ALTER TABLE `meetings` ADD INDEX `idx_is_live` (is_live)';

const downQuery = 'ALTER TABLE `meetings` DROP INDEX `idx_is_live`;';

const addIndexToIsAlive = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addIndexToIsAlive;

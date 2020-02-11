const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;

const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  "ALTER TABLE `texts` \n\
      MODIFY `text` VARCHAR(511) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';";

const downQuery =
  "ALTER TABLE `texts` \n\
      MODIFY `text` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';";

const alterColumnTextInTextsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = alterColumnTextInTextsTable;

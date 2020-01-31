const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  "ALTER TABLE `texts` \n\
      MODIFY `text` VARCHAR(511) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';";

const downQuery =
  "ALTER TABLE `texts` \n\
      MODIFY `text` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';";

const alterColumnBalancesInPepocornBalances = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = alterColumnBalancesInPepocornBalances;

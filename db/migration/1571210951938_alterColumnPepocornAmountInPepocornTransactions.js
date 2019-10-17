const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.redemptionDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  "ALTER TABLE `pepocorn_transactions` \n\
      MODIFY `pepocorn_amount` DECIMAL(13,3) NOT NULL DEFAULT '0';";

const downQuery = 'ALTER TABLE `pepocorn_transactions` MODIFY `pepocorn_amount` INT(11);';

const migrationName = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = migrationName;

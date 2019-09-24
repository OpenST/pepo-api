const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.fiatDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery = "ALTER TABLE `fiat_payments` \n\
      MODIFY `amount` float(8,3) NOT NULL DEFAULT '0';";

const downQuery = 'ALTER TABLE `fiat_payments` MODIFY `amount` decimal(30,0);';

const migrationName = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = migrationName;

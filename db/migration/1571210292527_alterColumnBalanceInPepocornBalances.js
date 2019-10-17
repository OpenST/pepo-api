const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.redemptionDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery = "ALTER TABLE `pepocorn_balances` \n\
      MODIFY `balance` DECIMAL(13,3) NOT NULL DEFAULT '0';";

const downQuery = 'ALTER TABLE `pepocorn_balances` MODIFY `balance` INT(11) NOT NULL;';

const alterColumnBalancesInPepocornBalances = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = alterColumnBalancesInPepocornBalances;

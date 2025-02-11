const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.feedDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'ALTER TABLE `transactions` DROP `giphy_id`;';

const removeUserNameFromTransactions = {
  dbName: dbName,
  up: [upQuery],
  down: [],
  dbKind: dbKind
};

module.exports = removeUserNameFromTransactions;

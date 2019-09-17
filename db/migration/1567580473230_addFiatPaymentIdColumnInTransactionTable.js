const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.feedDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `transactions` \n\
      ADD COLUMN `fiat_payment_id` bigint(20) unsigned AFTER `ost_tx_id`;';

const downQuery = 'ALTER TABLE `transactions` DROP `fiat_payment_id`;';

const addFiatPaymentIdInTransactionTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addFiatPaymentIdInTransactionTable;

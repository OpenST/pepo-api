const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.feedDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `transactions` DROP `fiat_payment_id`, DROP `video_id`;';

const downQuery =
  'ALTER TABLE `transactions` \n\
      ADD COLUMN `video_id` bigint(20) unsigned NULL AFTER `kind`, \n\
      ADD COLUMN `fiat_payment_id` bigint(20) unsigned NULL AFTER `ost_tx_id`;';

const removeColumnFiatPaymentIdAndVideoIdFromTransactions = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = removeColumnFiatPaymentIdAndVideoIdFromTransactions;

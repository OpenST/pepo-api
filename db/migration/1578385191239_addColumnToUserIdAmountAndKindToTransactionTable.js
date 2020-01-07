const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.feedDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `transactions` \n\
      ADD COLUMN `to_user_id` bigint(20) NULL AFTER `from_user_id`, \n\
      ADD COLUMN `amount` decimal(30,0) NULL AFTER `to_user_id`, \n\
      ADD COLUMN `kind` tinyint(4) NULL AFTER `amount`;';

const downQuery = 'ALTER TABLE `transactions` DROP `to_user_id`, DROP `amount`, DROP `kind`;';

const addColumnToUserIdAmountAndKindToTransactionTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnToUserIdAmountAndKindToTransactionTable;

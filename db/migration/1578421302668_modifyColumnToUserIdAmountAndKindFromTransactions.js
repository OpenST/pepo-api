const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.feedDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `transactions` \n\
      MODIFY `to_user_id` bigint(20) NOT NULL, \n\
      MODIFY `amount` decimal(30,0) NOT NULL, \n\
      MODIFY `kind` tinyint(4) NOT NULL; ';

const downQuery =
  'ALTER TABLE `transactions` \n\
      MODIFY `to_user_id` bigint(20) NULL, \n\
      MODIFY `amount` decimal(30,0) NULL, \n\
      MODIFY `kind` tinyint(4) NULL; ';

const modifyColumnToUserIdAmountAndKindFromTransactions = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = modifyColumnToUserIdAmountAndKindFromTransactions;

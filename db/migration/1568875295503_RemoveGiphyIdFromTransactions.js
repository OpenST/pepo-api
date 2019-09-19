const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.feedDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `transactions` DROP `giphy_id`;';

const downQuery = 'ALTER TABLE `transactions` \n\
      ADD COLUMN `giphy_id` bigint(20) AFTER `text_id`';

const removeUserNameFromTransactions = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = removeUserNameFromTransactions;

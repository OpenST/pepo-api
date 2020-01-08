const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.feedDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `transactions` DROP `text_id`;';

const downQuery =
  'ALTER TABLE `transactions` \n\
      ADD COLUMN `text_id` bigint(20) unsigned NULL AFTER `extra_data`;';

const removeColumnTextIdFromTransactionTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = removeColumnTextIdFromTransactionTable;

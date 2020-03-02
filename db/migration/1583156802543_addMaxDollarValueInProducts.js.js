const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.redemptionDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `products` \n\
      ADD COLUMN `max_dollar_value` decimal(21,2) NOT NULL DEFAULT 100000.00 AFTER `min_dollar_value`';

const downQuery = 'ALTER TABLE `products` DROP `max_dollar_value`;';

const addColumnMaxDollarValueInProducts = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnMaxDollarValueInProducts;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.redemptionDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `products` \n\
      ADD COLUMN `display_order` decimal(21,2) NULL AFTER `dollar_step`';

const downQuery = 'ALTER TABLE `products` DROP `display_order`;';

const addColumnDisplayOrderInProducts = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnDisplayOrderInProducts;

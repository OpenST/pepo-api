const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.redemptionDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `products` \n\
      ADD COLUMN `description` text NULL AFTER `images`';

const downQuery = 'ALTER TABLE `products` DROP `images`;';

const addColumnDescriptionInProducts = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnDescriptionInProducts;

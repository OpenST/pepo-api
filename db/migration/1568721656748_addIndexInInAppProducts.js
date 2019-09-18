const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.fiatDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `in_app_products` \n\
      ADD INDEX `idx_1` (`apple_product_id`), \n\
      ADD INDEX `idx_2` (`google_product_id`);';

const downQuery = 'ALTER TABLE `in_app_products` \n\
      DROP INDEX `idx_2`,\n\
      DROP INDEX `idx_1`;';

const addIndexInInAppProducts = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addIndexInInAppProducts;

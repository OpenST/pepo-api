const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.fiatDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `in_app_products` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `product_id` varchar(40) NOT NULL, \n\
  `apple_id` varchar(40) NOT NULL, \n\
  `google_id` varchar(40) NOT NULL, \n\
  `price_point_in_usd` decimal(5,5) NOT NULL, \n\
  `pepo_amount` decimal(5,5) NOT NULL, \n\
  `amount_in_usd` decimal(5,5) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  INDEX idx_1 (`price_point_in_usd`, `amount_in_usd`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `in_app_products`;';

const createInAppProductsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createInAppProductsTable;

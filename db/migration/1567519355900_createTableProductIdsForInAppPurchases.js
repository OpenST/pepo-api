const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.fiatDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `in_app_products` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `apple_product_id` varchar(40) DEFAULT NULL, \n\
  `google_product_id` varchar(40) DEFAULT NULL, \n\
  `status` tinyint(4) NOT NULL,\n\
  `lower_limit` float(5,3) NOT NULL, \n\
  `upper_limit` float(5,3) NOT NULL, \n\
  `pepo_amount_in_wei` decimal(30,0) NOT NULL, \n\
  `amount_in_usd` float(8,3) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  INDEX idx_limit_status (`lower_limit`, `upper_limit`, `status`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `in_app_products`;';

const createInAppProductsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createInAppProductsTable;

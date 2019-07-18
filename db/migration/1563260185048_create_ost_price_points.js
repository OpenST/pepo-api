const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.ostDbName;

const upQuery =
  'CREATE TABLE `ost_price_points` (\n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n\
  `quote_currency` tinyint(4) NOT NULL,\n\
  `conversion_rate` decimal(21,10) NOT NULL,\n\
  `timestamp` int(11) NOT NULL,\n\
  `created_at` int(11) NOT NULL,\n\
  `updated_at` int(11) NOT NULL,\n\
  PRIMARY KEY (`id`),\n\
  KEY `ck_1` (`quote_currency`, `timestamp`)\n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `ost_price_points`;';

const createOstPricePointsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createOstPricePointsTable;

// db/migration/1563260185048_create_ost_price_points.js:29

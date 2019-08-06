const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.entityDbName;

const upQuery =
  "CREATE TABLE `texts` ( \n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
  `text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`) \n\
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

const downQuery = 'drop table if exists `texts`;';

const createTextsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createTextsTable;

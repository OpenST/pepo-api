const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  "CREATE TABLE `tags` ( \n\
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT, \n\
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '', \n\
  `weight` bigint(20) NOT NULL, \n\
  `status` tinyint(4) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE KEY `idx_1` (`name`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

const downQuery = 'drop table if exists `tags`;';

const createTagsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createTagsTable;

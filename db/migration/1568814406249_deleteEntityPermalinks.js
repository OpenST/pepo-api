const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'drop table if exists `entity_permalinks`;';

const downQuery =
  'CREATE TABLE `entity_permalinks` ( \n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
  `entity_kind` tinyint(4) NOT NULL, \n\
  `entity_id` bigint(20) NOT NULL, \n\
  `permalink` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `status` tinyint(4) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`) \n\
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const deleteEntityPermalinksTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = deleteEntityPermalinksTable;

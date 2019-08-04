const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.entityDbName;
const upQuery =
  'CREATE TABLE `external_entities` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `entity_kind` tinyint(4) NOT NULL, \n\
      `entity_id` varchar(40) NOT NULL, \n\
      `extra_data` TEXT COLLATE utf8_unicode_ci NOT NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      INDEX idx_1 (entity_kind,entity_id) \n\
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `external_entities`;';

const createExternalEntitiesTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createExternalEntitiesTable;

const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `curated_entities` ( \n\
        `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
        `entity_id` bigint(20) NOT NULL, \n\
        `entity_kind` tinyint(4) NOT NULL, \n\
        `position` tinyint(4) NOT NULL, \n\
        `created_at` int(11) NOT NULL, \n\
        `updated_at` int(11) NOT NULL, \n\
        PRIMARY KEY (`id`), \n\
        ADD INDEX c_idx_1 (`entity_id`, `entity_kind`),\n\
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `curated_entities`;';

const createCuratedEntitiesTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createCuratedEntitiesTable;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.feedDbName;

const upQuery =
  'CREATE TABLE `activities` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `entity_type` tinyint(4) NOT NULL, \n\
  `entity_id` bigint(20) unsigned NOT NULL, \n\
  `extra_data` TEXT COLLATE utf8_unicode_ci, \n\
  `status` tinyint(4) NOT NULL, \n\
  `published_ts` int(11), \n\
  `display_ts` int(11), \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE uidx_1 (`entity_type`, `entity_id`), \n\
  INDEX idx_2 (`status`, `published_ts`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `activities`;';

const createActivityTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createActivityTable;

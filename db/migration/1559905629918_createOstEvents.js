const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.ostDbName;

const upQuery =
  "CREATE TABLE `ost_events` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `event_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `status` tinyint(4) NOT NULL DEFAULT '1', \n\
      `event_data` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      UNIQUE KEY `uk_event_id` (`event_id`) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;";

const downQuery = 'drop table if exists `ost_events`;';

const createUsersTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createUsersTable;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.bigDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `aggregated_notifications` (\n' +
  '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
  '  `user_id` bigint(20) NOT NULL,\n' +
  '  `location_id` int(11) NOT NULL,\n' +
  '  `extra_data` text COLLATE utf8mb4_unicode_ci,\n' +
  '  `status` tinyint(4) NOT NULL,\n' +
  '  `created_at` int(11) NOT NULL,\n' +
  '  `updated_at` int(11) NOT NULL,\n' +
  '  PRIMARY KEY (`id`),\n' +
  '  UNIQUE KEY `user_id` (`user_id`),\n' +
  '  KEY `uidx_1` (`status`,`location_id`)\n' +
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';

const downQuery = 'drop table if exists `aggregated_notifications`;';

const createAggregatedNotifications = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createAggregatedNotifications;

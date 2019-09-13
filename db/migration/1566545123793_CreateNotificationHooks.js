const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.bigDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `notification_hooks` (\n' +
  '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
  '  `user_device_ids` text COLLATE utf8mb4_unicode_ci NOT NULL,\n' +
  '  `event_type` tinyint(4) NOT NULL,\n' +
  '  `raw_notification_payload` text COLLATE utf8mb4_unicode_ci NOT NULL,\n' +
  '  `status` int(11) NOT NULL,\n' +
  '  `execution_timestamp` int(11) NOT NULL,\n' +
  '  `lock_identifier` decimal(22,10) DEFAULT NULL,\n' +
  '  `locked_at` int(11) DEFAULT NULL,\n' +
  '  `created_at` int(11) NOT NULL,\n' +
  '  `updated_at` int(11) NOT NULL,\n' +
  '  PRIMARY KEY (`id`),\n' +
  '  KEY `idx_1` (`status`,`execution_timestamp`),\n' +
  '  KEY `idx_2` (`lock_identifier`)\n' +
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';

const downQuery = 'drop table if exists `notification_hooks`;';

const createNotificationHooks = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createNotificationHooks;

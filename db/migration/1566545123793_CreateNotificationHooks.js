const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.bigDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `notification_hooks` (\n' +
  '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
  '  `recipients` TEXT COLLATE utf8_unicode_ci NOT NULL,\n' +
  '  `push_notification_payload` TEXT COLLATE utf8_unicode_ci NOT NULL,\n' +
  '  `execution_timestamp` int(11) NOT NULL,\n' +
  '  `lock_identifier` decimal(22,10) DEFAULT NULL,\n' +
  '  `locked_at` int(11) DEFAULT NULL,\n' +
  "  `status` int(11) NOT NULL DEFAULT '1',\n" +
  '  `ios_response` text COLLATE utf8_unicode_ci,\n' +
  '  `android_response` text COLLATE utf8_unicode_ci,\n' +
  '  `created_at` int(11) NOT NULL,\n' +
  '  `updated_at` int(11) NOT NULL,\n' +
  '  PRIMARY KEY (`id`),\n' +
  '  KEY `idx_1` (`status`,`execution_timestamp`),\n' +
  '  KEY `idx_2` (`lock_identifier`)\n' +
  ') ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `notification_hooks`;';

const createNotificationHooks = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createNotificationHooks;

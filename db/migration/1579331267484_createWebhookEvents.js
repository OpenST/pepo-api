const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.webhookDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `webhook_events` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `client_id` int(11) NOT NULL,\
  `w_e_uuid` varchar(50) NOT NULL,\
  `uuid` varchar(50) NOT NULL,\
  `topic_kind` tinyint(4) NOT NULL,\
  `extra_data` text COLLATE utf8_unicode_ci, \
  `status` tinyint(4) NOT NULL, \
  `execute_at` int(11) NOT NULL,\
  `retry_count` tinyint(4) NOT NULL DEFAULT 0,\
  `lock_id` varchar(50) NOT NULL, \
  `error_response` text COLLATE utf8_unicode_ci, \
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`),\
  INDEX nuidx_1 (`lock_id`, `status`, `execute_at`)\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `webhook_events`;';

const createWebhookEvents = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createWebhookEvents;

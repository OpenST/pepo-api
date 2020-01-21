const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.webhookDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `webhook_subscriptions` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `client_id` int(11) NOT NULL,\
  `w_e_uuid` varchar(50) NOT NULL,\
  `topic_kind` tinyint(4) NOT NULL,\
  `content_entity_id` bigint(20) NOT NULL,\
  `status` tinyint(4) NOT NULL, \
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`),\
  INDEX nuidx_1 (`w_e_uuid`),\
  INDEX nuidx_2 (`content_entity_id`, `topic_kind` )\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `webhook_subscriptions`;';

const createWebhookSubscriptions = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createWebhookSubscriptions;

const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.webhookDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `webhook_endpoints` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `uuid` varchar(50) NOT NULL,\
  `client_id` int(11) NOT NULL,\
  `api_version` tinyint(4) NOT NULL,\
  `endpoint` varchar(250) NOT NULL, \
  `secret` varchar(100) NOT NULL, \
  `grace_secret` varchar(100), \
  `secret_salt` blob NOT NULL, \
  `grace_expiry_at` int(11) NOT NULL DEFAULT 0,\
  `status` tinyint(4) NOT NULL, \
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`),\
  UNIQUE uidx_1 (`uuid`)\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `webhook_endpoints`;';

const createWebhookEndpoints = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createWebhookEndpoints;

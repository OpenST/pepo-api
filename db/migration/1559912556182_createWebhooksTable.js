const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  "CREATE TABLE `webhooks` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `ost_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `status` tinyint(4) NOT NULL DEFAULT '1', \n\
      `secret` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, \n\
      `encryption_salt` blob, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      INDEX idx_1 (ost_id) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;";

const downQuery = 'drop table if exists `webhooks`;';

const createWebhooksTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createWebhooksTable;

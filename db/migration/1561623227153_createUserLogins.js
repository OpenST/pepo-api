const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const upQuery =
  "CREATE TABLE `user_logins` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `user_id` bigint(20) NOT NULL, \n\
  `service` tinyint(4) NOT NULL, \n\
  `service_unique_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT '', \n\
  `properties` tinyint(4) NOT NULL DEFAULT '0', \n\
  `created_at` int(11) NOT NULL,\n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  INDEX idx_1 (`user_id`), \n\
  KEY `cuk_1` (`service`,`service_unique_id`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci";

const downQuery = 'drop table if exists `user_logins`;';

const migrationName = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = migrationName;

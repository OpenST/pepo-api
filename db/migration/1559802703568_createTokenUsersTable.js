const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  "CREATE TABLE `token_users` ( \n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
  `user_id` bigint(20) NOT NULL, \n\
  `ost_user_id` bigint(20) NOT NULL, \n\
  `ost_token_holder_address` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `scrypt_salt` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `encryption_salt` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `properties` tinyint(4) NOT NULL, \n\
  `ost_status` tinyint(4) NOT NULL DEFAULT '1', \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE KEY `uk_user_id` (`user_id`), \n\
  UNIQUE KEY `uk_ost_user_id` (`ost_user_id`) \n\
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;";

const downQuery = 'drop table if exists `token_users`;';

const createTokenUsersTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createTokenUsersTable;

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `twitter_users_extended` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `twitter_user_id` bigint(20) NOT NULL, \n\
      `token` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `secret` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `status` tinyint(4) NOT NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      UNIQUE KEY `uk_twitter_user_id` (`twitter_user_id`) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `twitter_users_extended`;';

const createTwitterUsersExtendedTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createTwitterUsersExtendedTable;

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `twitter_users` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `twitter_id` bigint(20) NOT NULL, \n\
      `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL, \n\
      `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `user_id` bigint(20) NULL, \n\
      `profile_image_url` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      UNIQUE KEY `uk_twitter_id` (`twitter_id`) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `twitter_users`;';

const createTwitterUsersTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createTwitterUsersTable;

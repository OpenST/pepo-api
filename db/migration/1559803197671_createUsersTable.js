const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.userDbName;
const upQuery =
  "CREATE TABLE `users` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `user_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `encryption_salt` blob NOT NULL, \n\
      `mark_inactive_trigger_count` tinyint(4) NOT NULL DEFAULT '0', \n\
      `properties` tinyint(4) NOT NULL DEFAULT '0', \n\
      `status` tinyint(4) NOT NULL DEFAULT '1', \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      UNIQUE KEY `uk_user_name` (`user_name`) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;";

const downQuery = 'drop table if exists `users`;';

const createUsersTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createUsersTable;

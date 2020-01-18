const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `apple_users` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `apple_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `user_id` bigint(20), \n\
      `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      UNIQUE KEY `uk_apple_id` (`apple_id`) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `apple_users`;';

const createAppleUsersTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createAppleUsersTable;

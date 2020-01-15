const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `github_users` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `github_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `user_id` bigint(20) NOT NULL, \n\
      `github_login` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, \n\
      `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, \n\
      `profile_image_url` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, \n\
      `bio` blob, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      UNIQUE KEY `uk_github_id` (`github_id`) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `github_users`;';

const createGithubUsersTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createGithubUsersTable;

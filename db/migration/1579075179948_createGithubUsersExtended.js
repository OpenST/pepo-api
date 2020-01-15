const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `github_users_extended` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `github_user_id` bigint(20) NOT NULL, \n\
      `access_token` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `github_users_extended`;';

const createGithubUsersExtendedTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createGithubUsersExtendedTable;

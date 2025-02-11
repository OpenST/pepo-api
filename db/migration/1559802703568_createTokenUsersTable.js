const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  "CREATE TABLE `token_users` ( \n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
  `user_id` bigint(20) NOT NULL, \n\
  `ost_user_id` varchar(40) NOT NULL, \n\
  `ost_token_holder_address` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL, \n\
  `scrypt_salt` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `encryption_salt` blob NOT NULL, \n\
  `properties` tinyint(4) NOT NULL DEFAULT '0', \n\
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
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createTokenUsersTable;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `google_users_extended` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `google_user_id` bigint(20) NOT NULL,\
  `access_token` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\
  `refresh_token` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`)\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `google_users_extended`;';

const createGoogleUsersExtended = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createGoogleUsersExtended;

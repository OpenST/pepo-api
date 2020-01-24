const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `google_users` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `google_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `user_id` bigint(20) NOT NULL,\
  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL,\
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL, \n\
  `profile_image_url` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL, \n\
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`)\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `google_users`;';

const createGoogleUsers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createGoogleUsers;

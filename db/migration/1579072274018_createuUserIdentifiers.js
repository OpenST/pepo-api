const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `user_identifiers` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `user_id` bigint(20) NOT NULL,\
  `e_value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL,\
  `e_kind` tinyint(4) NOT NULL,\n\
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`)\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `user_identifiers`;';

const createUserIdentifiers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createUserIdentifiers;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.bigDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `internal_users` (\
    `id` bigint(20) NOT NULL AUTO_INCREMENT,\
    `user_id` bigint(20) NOT NULL,\
    `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL, \
    `created_at` int(11) NOT NULL,\
    `updated_at` int(11) NOT NULL,\
    PRIMARY KEY (`id`)\n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `internal_users`;';

const createInternalUsers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createInternalUsers;

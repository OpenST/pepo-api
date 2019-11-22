const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `user_mutes` ( \n\
        `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
        `user1_id` bigint(20) NOT NULL,\n\
        `user2_id` bigint(20) NOT NULL, \n\
        `created_at` int(11) NOT NULL, \n\
        `updated_at` int(11) NOT NULL, \n\
        PRIMARY KEY (`id`), \n\
        UNIQUE KEY `uk_1` (`user1_id`, `user2_id`) \n\
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `user_mutes`;';

const createUserMuteTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createUserMuteTable;

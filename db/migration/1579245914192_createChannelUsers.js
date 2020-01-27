const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.channelDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `channel_users` (\n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n\
  `channel_id` bigint(20) NOT NULL,\n\
  `user_id` bigint(20) NOT NULL,\n\
  `role` tinyint(4) NOT NULL,\n\
  `status` tinyint(4) NOT NULL,\n\
  `created_at` int(11) NOT NULL,\n\
  `updated_at` int(11) NOT NULL,\n\
  PRIMARY KEY (`id`),\n\
  UNIQUE uidx_1 (`user_id`, `channel_id`),\n\
  INDEX `idx_2` (`channel_id`, `created_at`) \n\
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `channel_users`;';

const createChannelUsers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createChannelUsers;

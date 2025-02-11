const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.channelDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `channel_stats` ( \n\
        `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
        `channel_id` bigint(20) NOT NULL,\n\
        `total_videos` int(11) NOT NULL, \n\
        `total_users` int(11) NOT NULL,\n\
        `created_at` int(11) NOT NULL, \n\
        `updated_at` int(11) NOT NULL, \n\
        PRIMARY KEY (`id`), \n\
        UNIQUE KEY `uk_1` (`channel_id`) \n\
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `channel_stats`;';

const createChannelStatsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createChannelStatsTable;

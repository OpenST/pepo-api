const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.channelDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `channel_tags` ( \n\
        `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
        `channel_id` bigint(20) NOT NULL,\n\
        `tag_id` bigint(20) NOT NULL, \n\
        `status` tinyint(4) NOT NULL,\n\
        `created_at` int(11) NOT NULL, \n\
        `updated_at` int(11) NOT NULL, \n\
        PRIMARY KEY (`id`), \n\
        UNIQUE KEY `uk_1` (`channel_id`) \n\
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `channel_tags`;';

const createChannelTagsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createChannelTagsTable;

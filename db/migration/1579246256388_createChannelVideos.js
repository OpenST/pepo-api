const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.channelDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `channel_videos` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `channel_id` bigint(20) NOT NULL,\n\
  `video_id` bigint(20) NOT NULL,\n\
  `video_kind` tinyint(4) NOT NULL,\
  `status` tinyint(4) NOT NULL,\
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`),\
  UNIQUE uidx_1 (`video_id`, `channel_id`), \n\
  INDEX `idx_2` (`channel_id`, `created_at`) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `channel_videos`;';

const createChannelVideos = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createChannelVideos;

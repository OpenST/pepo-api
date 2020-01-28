const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.channelDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `channel_tag_videos` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `channel_id` bigint(20) NOT NULL,\n\
  `tag_id` bigint(20) NOT NULL,\n\
  `video_id` bigint(20) NOT NULL,\n\
  `pinned_at` int(11) DEFAULT NULL,\
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`),\
  UNIQUE uidx_1 (`channel_id`, `tag_id`, `video_id`), \n\
  INDEX `idx_2` (`video_id`) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `channel_tag_videos`;';

const createChannelTagVideos = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createChannelTagVideos;

const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.meetingDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `meetings` (\n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
  `host_user_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `meeting_relayer_id` bigint(20), \n\
  `start_timestamp` int(11), \n\
  `end_timestamp` int(11), \n\
  `live_participants` int(11) DEFAULT 0, \n\
  `cumulative_participants` int(11) DEFAULT 0, \n\
  `channel_id` bigint(20) NOT NULL, \n\
  `zoom_meeting_id` bigint(20), \n\
  `recording_url` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, \n\
  `status` tinyint(4), \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE `uidx_1` (`channel_id`, `status`), \n\
  UNIQUE `uidx_2` (`zoom_meeting_id`) \n\
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `meetings`;';

const createMeetingsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createMeetingsTable;

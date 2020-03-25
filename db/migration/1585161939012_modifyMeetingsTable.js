const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.meetingDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `meetings` \n\
      ADD COLUMN `host_join_count` int(11) AFTER `zoom_uuid`, \n\
      ADD COLUMN `host_leave_count` int(11) AFTER `zoom_uuid`, \n\
      DROP COLUMN `host_joined_at` ,\n\
      DROP COLUMN `host_left_at`;';

const downQuery =
  'ALTER TABLE `meetings` \n\
      ADD COLUMN `host_joined_at` int(11) AFTER `zoom_uuid`, \n\
      ADD COLUMN `host_left_at` int(11) AFTER `zoom_uuid`, \n\
      DROP COLUMN `host_join_count` ,\n\
      DROP COLUMN `host_leave_count`;';

const ModifyMeetingTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = ModifyMeetingTable;

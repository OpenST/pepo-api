const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.meetingDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `meetings` \n\
      ADD COLUMN `host_joined_at` int(11) AFTER `zoom_uuid`, \n\
      ADD COLUMN `host_left_at` int(11) AFTER `host_joined_at`;';

const downQuery = 'ALTER TABLE `meetings` DROP `host_joined_at`, DROP `host_left_at` ;';

const AddHostTimestampsInMeetings = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = AddHostTimestampsInMeetings;

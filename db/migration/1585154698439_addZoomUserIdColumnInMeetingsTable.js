const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.meetingDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'ALTER TABLE `meetings` ADD `zoom_uuid` varchar(50) NULL after `zoom_meeting_id`;';

const downQuery = 'ALTER TABLE `meetings` DROP `zoom_uuid`;';

const addZoomUserIdColumnInMeetingsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addZoomUserIdColumnInMeetingsTable;

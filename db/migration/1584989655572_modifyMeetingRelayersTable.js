const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.meetingDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'ALTER TABLE `meeting_relayers` \n\
  MODIFY COLUMN `last_meeting_created_at` INT(11) NULL AFTER `status`';

const downQuery = 'ALTER TABLE `meeting_relayers` DROP `last_meeting_created_at`;';

const modifyMeetingRelayersTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = modifyMeetingRelayersTable;

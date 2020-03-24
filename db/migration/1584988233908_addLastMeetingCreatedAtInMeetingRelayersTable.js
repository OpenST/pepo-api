const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.meetingDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'ALTER TABLE `meeting_relayers` \n\
  ADD COLUMN `last_meeting_created_at` int(11) NOT NULL, \n\
  DROP INDEX `idx_1`, \n\
  ADD INDEX `c_idx_1` (`status`, `last_meeting_created_at`)';

const downQuery = 'ALTER TABLE `meeting_relayers` DROP `last_meeting_created_at` DROP INDEX `c_idx_1`;';

const addLastMeetingCreatedAtInMeetingRelayersTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addLastMeetingCreatedAtInMeetingRelayersTable;

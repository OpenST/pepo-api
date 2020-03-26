const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.meetingDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `meetings` DROP `live_participants`, DROP `cumulative_participants`;';

const downQuery =
  'ALTER TABLE `meetings` \n\
      ADD COLUMN `live_participants` int(11) DEFAULT 0 AFTER `end_timestamp`, \n\
      ADD COLUMN `cumulative_participants` int(11) DEFAULT 0 AFTER `live_participants`;';

const removeParticipantsColumnFromMeeting = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = removeParticipantsColumnFromMeeting;

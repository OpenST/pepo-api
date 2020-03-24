const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.meetingDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `meeting_relayers` ADD UNIQUE INDEX `uk_zoom_uid` (`zoom_user_id`);';

const downQuery = 'ALTER TABLE `meeting_relayers` DROP INDEX `uk_zoom_uid`;';

const addUniqIndexInMeetingRelayers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addUniqIndexInMeetingRelayers;

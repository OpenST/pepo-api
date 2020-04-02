const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.meetingDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `meetings` ADD UNIQUE INDEX `uidx_3` (`zoom_uuid`);';

const downQuery = 'ALTER TABLE `meetings` DROP INDEX `uidx_3`;';

const _addUniqIndexOnZoomUuidInMeetings = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = _addUniqIndexOnZoomUuidInMeetings;

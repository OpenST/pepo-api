const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.meetingDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'ALTER TABLE `meetings` \n\
  ADD COLUMN `is_live` tinyint(4) NULL AFTER `status`, \n\
  DROP INDEX `uidx_1`, \n\
  ADD UNIQUE `c_uidx_1` (`channel_id`, `is_live`), \n\
  ADD UNIQUE `c_uidx_2` (`host_user_id`, `is_live`)';

const downQuery = 'ALTER TABLE `meetings` DROP `is_live` DROP INDEX `c_uidx_1` DROP INDEX `c_uidx_2`;';

const addIsLiveColumnInMeetingsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addIsLiveColumnInMeetingsTable;

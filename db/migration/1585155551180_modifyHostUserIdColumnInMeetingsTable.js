const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.meetingDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'ALTER TABLE `meetings` MODIFY COLUMN `host_user_id` bigint(20) NOT NULL';

const downQuery =
  'ALTER TABLE `meetings` MODIFY COLUMN `host_user_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL;';

const modifyHostUserIdColumnInMeetingsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = modifyHostUserIdColumnInMeetingsTable;

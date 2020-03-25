const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.meetingDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'ALTER TABLE `meetings` AUTO_INCREMENT = 10000';

const downQuery = 'ALTER TABLE `meetings` AUTO_INCREMENT = 1;';

const updateMeetingAutoIncrement = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = updateMeetingAutoIncrement;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `user_devices` \n\
      ADD COLUMN `user_timezone` varchar(255) NOT NULL AFTER `device_token`; ';

const downQuery = 'ALTER TABLE `user_devices` DROP `user_timezone`;';

const addColumnUserTimeZoneInUserDevicesTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnUserTimeZoneInUserDevicesTable;

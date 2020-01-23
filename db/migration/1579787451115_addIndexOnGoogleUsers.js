const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery1 = 'ALTER TABLE `google_users` ADD UNIQUE INDEX `uidx_1` (`google_id`);';
const upQuery2 = 'ALTER TABLE `google_users` ADD UNIQUE INDEX `uidx_2` (`user_id`);';

const downQuery1 = 'ALTER TABLE `google_users` DROP INDEX `uidx_1`;';
const downQuery2 = 'ALTER TABLE `google_users` DROP INDEX `uidx_2`;';

const addIndexOnGoogleUsers = {
  dbName: dbName,
  up: [upQuery1, upQuery2],
  down: [downQuery2, downQuery1],
  dbKind: dbKind
};

module.exports = addIndexOnGoogleUsers;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `google_users_extended` ADD UNIQUE INDEX `uidx_1` (`google_user_id`);';

const downQuery = 'ALTER TABLE `google_users_extended` DROP INDEX `uidx_1`;';

const addIndexOnGoogleUserExtended = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addIndexOnGoogleUserExtended;

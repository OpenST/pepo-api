const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `apple_users_extended` ADD UNIQUE INDEX `uk_apple_user_id` (`apple_user_id`);';

const downQuery = 'ALTER TABLE `apple_users_extended` DROP INDEX `uk_apple_user_id`;';

const addUniqIndexInAppleUsersExtended = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addUniqIndexInAppleUsersExtended;

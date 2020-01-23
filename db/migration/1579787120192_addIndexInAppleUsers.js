const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `apple_users` ADD UNIQUE INDEX `uk_user_id` (`user_id`);';

const downQuery = 'ALTER TABLE `apple_users` DROP INDEX `uk_user_id`;';

const addUniqIndexInAppleUsers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addUniqIndexInAppleUsers;

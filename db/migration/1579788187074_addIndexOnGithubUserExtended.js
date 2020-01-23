const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.socialConnectDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `github_users_extended` ADD UNIQUE INDEX `uidx_1` (`github_user_id`);';

const downQuery = 'ALTER TABLE `github_users_extended` DROP INDEX `uidx_1`;';

const addIndexOnGithubUserExtended = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addIndexOnGithubUserExtended;

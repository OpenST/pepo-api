const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `pre_launch_invites` \n\
    DROP INDEX `uk_email`, \n\
      AUTO_INCREMENT = 6600;';

const downQuery = 'ALTER TABLE `pre_launch_invites` ADD UNIQUE KEY `uk_email`(`email`);';

const addColumnHandleInPreLaunchInvites = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnHandleInPreLaunchInvites;

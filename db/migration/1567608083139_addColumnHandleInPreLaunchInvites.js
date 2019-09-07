const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `pre_launch_invites` \n\
      ADD COLUMN `handle` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL AFTER `twitter_id`;';

const downQuery = 'ALTER TABLE `pre_launch_invites` DROP `handle`;';

const addColumnHandleInPreLaunchInvites = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnHandleInPreLaunchInvites;

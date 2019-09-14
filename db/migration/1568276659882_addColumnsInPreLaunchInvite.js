const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `pre_launch_invites` \n\
      ADD COLUMN `inviter_code_id` bigint(20) NULL AFTER `invite_code`,\n\
      ADD COLUMN `invite_code_id` bigint(20) NULL AFTER `inviter_code_id`;';

const downQuery = 'ALTER TABLE `pre_launch_invites` DROP `invite_code_id`, DROP `inviter_code_id`;';

const addColumnsInPreLaunchInvite = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnsInPreLaunchInvite;

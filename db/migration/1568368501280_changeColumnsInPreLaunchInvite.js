const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;

const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'ALTER TABLE `pre_launch_invites` \n\
    CHANGE `invite_code` `invite_code` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL,\n\
    CHANGE `invite_code_id` `invite_code_id` bigint(20) NOT NULL;';

const downQuery =
  'ALTER TABLE `pre_launch_invites` \n\
    CHANGE `invite_code` `invite_code` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\n\
    CHANGE `invite_code_id` `invite_code_id` bigint(20) NULL;';

const changeColumnsInPreLaunchInvite = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = changeColumnsInPreLaunchInvite;

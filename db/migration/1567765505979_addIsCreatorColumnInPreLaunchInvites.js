const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;

const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  "ALTER TABLE `pre_launch_invites` \n\
    ADD COLUMN `is_creator` tinyint(4) NOT NULL DEFAULT '0' AFTER `profile_image_url`;";

const downQuery = 'ALTER TABLE `pre_launch_invites` DROP `is_creator`;';

const addColumnIsCreatorInPreLaunchInvites = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnIsCreatorInPreLaunchInvites;

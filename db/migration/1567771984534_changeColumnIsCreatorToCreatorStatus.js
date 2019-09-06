const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;

const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  "ALTER TABLE `pre_launch_invites` \n\
    CHANGE `is_creator` `creator_status` tinyint(4) NOT NULL DEFAULT '0';";

const downQuery =
  "ALTER TABLE `pre_launch_invites` \n\
    CHANGE `creator_status` `is_creator` tinyint(4) NOT NULL DEFAULT '0';";

const changeColumnIsCreatorToCreatorStatus = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = changeColumnIsCreatorToCreatorStatus;

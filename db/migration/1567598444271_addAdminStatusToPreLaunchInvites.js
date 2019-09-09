const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `pre_launch_invites` ADD `admin_status` tinyint(4) NOT NULL AFTER `status`;';

const downQuery = 'ALTER TABLE `pre_launch_invites` DROP `admin_status`;';

const addAdminStatus = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addAdminStatus;

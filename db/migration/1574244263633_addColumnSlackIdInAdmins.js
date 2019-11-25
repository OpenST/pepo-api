const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.adminDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'ALTER TABLE `admins` \n\
      ADD COLUMN `slack_id` varchar(255) NULL AFTER `password`;';

const downQuery = 'ALTER TABLE `admins` DROP `slack_id`;';

const addColumnSlackIdInAdmins = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnSlackIdInAdmins;

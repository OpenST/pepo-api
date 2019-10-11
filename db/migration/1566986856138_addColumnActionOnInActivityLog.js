const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.adminDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `activity_logs` \n\
      ADD COLUMN `action_on` bigint(20) NOT NULL AFTER `action`, \n\
      CHANGE `data` `extra_data` varchar(255) NULL';

const downQuery =
  'ALTER TABLE `activity_logs` \n\
      CHANGE `extra_data` `data` int(11) NULL, \n\
      DROP `action_on`';

const addColumnActionOnInActivityLog = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnActionOnInActivityLog;

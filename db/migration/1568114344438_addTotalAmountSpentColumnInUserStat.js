const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;

const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'ALTER TABLE `user_stats` \n\
    ADD COLUMN `total_amount_spent` decimal(30,0) NOT NULL  DEFAULT 0 AFTER `total_amount_raised`;';

const downQuery = 'ALTER TABLE `user_stats` DROP `total_amount_spent`;';

const addColumnTotalAmountSpentInUserStat = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnTotalAmountSpentInUserStat;

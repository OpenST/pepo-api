const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.ostDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `tokens` \n\
      ADD COLUMN `utility_branded_token` varchar(255) NOT NULL AFTER `company_token_holder_address`; ';

const downQuery = 'ALTER TABLE `tokens` DROP `utility_branded_token`;';

const addColumnUtilityBrandedTokenInTokensTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnUtilityBrandedTokenInTokensTable;

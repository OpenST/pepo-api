const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.ostDbName;

const upQuery = 'ALTER TABLE `tokens` \n\
      ADD COLUMN `stake_currency` VARCHAR(255) NOT NULL AFTER `symbol`;';

const downQuery = 'ALTER TABLE `tokens` DROP `stake_currency`;';

const addStakeCurrencyInTokens = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addStakeCurrencyInTokens;

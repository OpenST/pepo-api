const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const upQuery = 'ALTER TABLE `tokens` \n\
      ADD COLUMN `stake_currency` VARCHAR(255) NOT NULL AFTER `symbol`;';

const downQuery = 'ALTER TABLE `tokens` DROP `stake_currency`;';

const addStakeCurrencyInTokens = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addStakeCurrencyInTokens;

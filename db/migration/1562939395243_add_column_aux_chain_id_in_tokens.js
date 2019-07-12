const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const upQuery = 'ALTER TABLE `tokens` \n\
      ADD COLUMN `aux_chain_id` int(11) NOT NULL AFTER `decimal`;';

const downQuery = 'ALTER TABLE `tokens` DROP `aux_chain_id`;';

const addAuxChainIdInTokens = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addAuxChainIdInTokens;

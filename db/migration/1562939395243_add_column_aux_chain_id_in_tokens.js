const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.ostDbName;

const upQuery = 'ALTER TABLE `tokens` \n\
      ADD COLUMN `aux_chain_id` int(11) NOT NULL AFTER `decimal`;';

const downQuery = 'ALTER TABLE `tokens` DROP `aux_chain_id`;';

const addAuxChainIdInTokens = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addAuxChainIdInTokens;

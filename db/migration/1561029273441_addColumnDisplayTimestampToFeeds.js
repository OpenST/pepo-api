const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery = 'ALTER TABLE `feeds` \n\
      ADD COLUMN `display_ts` int(11) DEFAULT NULL AFTER `published_ts`;';

const downQuery = 'ALTER TABLE `feeds` DROP `display_ts`;';

const addDisplayTimestampInFeeds = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addDisplayTimestampInFeeds;

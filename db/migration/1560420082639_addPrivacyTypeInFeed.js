const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery = 'ALTER TABLE `feeds` \n\
      ADD COLUMN `privacy_type` tinyint(4) NOT NULL  AFTER `extra_data`;';

const downQuery = 'ALTER TABLE `feeds` DROP `privacy_type`;';

const addPrivacyTypeInFeeds = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addPrivacyTypeInFeeds;

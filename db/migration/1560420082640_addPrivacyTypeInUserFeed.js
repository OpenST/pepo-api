const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery = 'ALTER TABLE `user_feeds` \n\
      ADD COLUMN `privacy_type` tinyint(4) NOT NULL  AFTER `feed_id`;';

const downQuery = 'ALTER TABLE `user_feeds` DROP `privacy_type`;';

const addPrivacyTypeInUserFeeds = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addPrivacyTypeInUserFeeds;

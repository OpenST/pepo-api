const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const upQuery = 'ALTER TABLE `twitter_users` \n\
      ADD UNIQUE KEY `uk_user_id` (`user_id`);';

const downQuery = 'ALTER TABLE `twitter_users` DROP INDEX `uk_user_id`;';

const addIndexInTwitterUser = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addIndexInTwitterUser;

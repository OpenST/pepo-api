const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.twitterDbName;

const upQuery = 'ALTER TABLE `twitter_users` \n\
      ADD UNIQUE KEY `uk_user_id` (`user_id`);';

const downQuery = 'ALTER TABLE `twitter_users` DROP INDEX `uk_user_id`;';

const addIndexInTwitterUser = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addIndexInTwitterUser;

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const upQuery = 'ALTER TABLE `user_activities` \n\
      DROP COLUMN `display_ts`;';

const downQuery = 'ALTER TABLE `user_activities` ADD COLUMN `display_ts` int(11) NOT NULL AFTER published_ts;';

const removeColumnDisplayTsInUserActivities = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = removeColumnDisplayTsInUserActivities;

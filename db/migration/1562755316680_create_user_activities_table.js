const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `user_activities` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `user_id` bigint(20) unsigned NOT NULL, \n\
  `activity_id` bigint(20) unsigned NOT NULL , \n\
  `published_ts` int(11), \n\
  `display_ts` int(11) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  INDEX idx_1 (`user_id`, `published_ts`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `user_activities`;';

const createUserActivitiesTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createUserActivitiesTable;

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `user_stats` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `user_id` bigint(20) unsigned NOT NULL, \n\
  `total_contributed_by` int(11) NOT NULL  DEFAULT 0, \n\
  `total_contributed_to` int(11) NOT NULL  DEFAULT 0, \n\
  `total_amount_raised` decimal(30,0) NOT NULL  DEFAULT 0, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE idx_1 (`user_id`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `user_stats`;';

const createUserStatsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createUserStatsTable;

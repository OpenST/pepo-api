const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  "CREATE TABLE `twitter_user_connections` ( \n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
  `twitter_user1_id` bigint(20) NOT NULL, \n\
  `twitter_user2_id` bigint(20) NOT NULL, \n\
  `properties` tinyint(4) NOT NULL DEFAULT '0', \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE u_idx_1 (`twitter_user1_id`, `twitter_user2_id`), \n\
  INDEX idx_2 (`twitter_user1_id`, `properties`), \n\
  INDEX idx_3 (`twitter_user2_id`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci";

const downQuery = 'drop table if exists `twitter_user_connections`;';

const createTwitterUserConnectionsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createTwitterUserConnectionsTable;

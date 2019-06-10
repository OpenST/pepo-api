const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `user_feeds` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `user_id` bigint(20) NOT NULL, \n\
      `feed_id` bigint(20) NOT NULL, \n\
      `published_ts` int(11) NOT NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      INDEX idx_1 (user_id,published_ts) \n\
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `user_feeds`;';

const createUserFeedsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createUserFeedsTable;

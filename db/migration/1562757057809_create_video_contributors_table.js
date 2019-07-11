const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `video_contributors` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `video_id` bigint(20) unsigned NOT NULL, \n\
  `contributed_by_user_id` bigint(20) unsigned NOT NULL, \n\
  `total_amount` decimal(30,0) NOT NULL  DEFAULT 0, \n\
  `total_transactions` int(11) NOT NULL  DEFAULT 0, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE uidx_1 (`video_id`, `contributed_by_user_id`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `video_contributors`;';

const createVideoContributorsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createVideoContributorsTable;

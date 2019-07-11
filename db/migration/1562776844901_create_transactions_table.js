const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `transactions` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `ost_tx_id` varchar(40) NOT NULL, \n\
  `from_user_id` bigint(20) unsigned NOT NULL, \n\
  `video_id` bigint(20) unsigned, \n\
  `extra_data` TEXT COLLATE utf8_unicode_ci NOT NULL, \n\
  `text_id` bigint(20) unsigned, \n\
  `giphy_id` bigint(20) unsigned, \n\
  `status` tinyint(4) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE uidx_1 (`ost_tx_id`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `transactions`;';

const createTransactionsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createTransactionsTable;

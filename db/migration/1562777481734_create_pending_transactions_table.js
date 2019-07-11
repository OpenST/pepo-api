const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `pending_transactions` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `ost_tx_id` varchar(40) NOT NULL, \n\
  `from_user_id` bigint(20) unsigned NOT NULL, \n\
  `video_id` bigint(20) unsigned, \n\
  `to_user_id` bigint(20) unsigned NOT NULL, \n\
  `amount`decimal(30,0) NOT NULL  DEFAULT 0, \n\
  `status` tinyint(4) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  INDEX idx_1 (`from_user_id`, `video_id`), \n\
  INDEX idx_2 (`from_user_id`, `to_user_id`), \n\
  INDEX idx_3 (`ost_tx_id`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `pending_transactions`;';

const createPendingTransactionsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createPendingTransactionsTable;

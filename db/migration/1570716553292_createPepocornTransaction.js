const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.redemptionDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `pepocorn_transactions` ( \n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
  `user_id` bigint(20) NOT NULL, \n\
  `kind` tinyint(4) NOT NULL, \n\
  `pepocorn_amount` int(11) NOT NULL, \n\
  `transaction_id` bigint(20) DEFAULT NULL, \n\
  `redemption_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL, \n\
  `status` tinyint(4) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE KEY `idx_1` (`transaction_id`), \n\
  INDEX idx_2 (`user_id`) \n\
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `pepocorn_transactions`;';

const createPepocornLedger = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createPepocornLedger;

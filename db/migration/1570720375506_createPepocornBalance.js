const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.redemptionDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `pepocorn_balances` ( \n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
  `user_id` bigint(20) NOT NULL, \n\
  `balance` int(11) NOT NULL  DEFAULT 0, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE KEY un_idx_1 (`user_id`) \n\
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `pepocorn_balances`;';

const createPepocornLedger = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createPepocornLedger;

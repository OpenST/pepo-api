const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.fiatDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `fiat_payments` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `reference_id` varchar(40) NOT NULL, \n\
  `from_user_id` bigint(20) unsigned NOT NULL, \n\
  `to_user_id` bigint(20) unsigned, \n\
  `kind` tinyint(4) NOT NULL,\n\
  `service_kind` tinyint(4),\n\
  `currency` tinyint(4) NOT NULL,\n\
  `amount` decimal(30,0) NOT NULL DEFAULT 0, \n\
  `pepo_amount` decimal(30,0) DEFAULT 0, \n\
  `card_detail_id` bigint(20) unsigned, \n\
  `risk_score` int(20) unsigned, \n\
  `transaction_id` bigint(20) unsigned, \n\
  `status` tinyint(4) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `fiat_payments`;';

const createFiatPaymentsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createFiatPaymentsTable;

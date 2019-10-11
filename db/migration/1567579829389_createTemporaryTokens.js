const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.bigDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `temporary_tokens` ( \n\
	  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
	  `entity_id` bigint(20) NOT NULL, \n\
	  `kind` tinyint(4) NOT NULL,\n\
	  `token` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\n\
    `status` tinyint(4) NOT NULL,\n\
    `created_at` int(11) NOT NULL, \n\
    `updated_at` int(11) NOT NULL, \n\
	  PRIMARY KEY (`id`), \n\
	  KEY `idx_1` (`entity_id`, `kind`)\n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `temporary_tokens`;';

const createTemporaryTokens = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createTemporaryTokens;

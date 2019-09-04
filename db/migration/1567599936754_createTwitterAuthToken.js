const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.twitterDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `twitter_auth_tokens` ( \n\
	  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
	  `token` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\n\
	  `secret` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\n\
    `status` tinyint(4) NOT NULL,\n\
    `created_at` int(11) NOT NULL, \n\
    `updated_at` int(11) NOT NULL, \n\
	  PRIMARY KEY (`id`), \n\
	  UNIQUE KEY `idx_1` (`token`)\n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `twitter_auth_tokens`;';

const createTwitterAuthTokens = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createTwitterAuthTokens;

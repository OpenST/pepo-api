const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const createTokensTable = {
  dbName: dbName,
  up: [
    "CREATE TABLE `tokens` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `symbol` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `decimal` int(11) DEFAULT '18', \n\
      `ost_token_id` int(11) NOT NULL, \n\
      `conversion_factor` decimal(15,6) NOT NULL, \n\
      `company_token_holder_address` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `api_key` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `api_secret` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `encryption_salt` blob NOT NULL, \n\
      `ost_company_user_id` int(11) NOT NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      UNIQUE KEY `uk_name` (`name`), \n\
      UNIQUE KEY `uk_symbol` (`symbol`) \n\
    ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;"
  ],
  down: ['DROP TABLE tokens']
};

module.exports = createTokensTable;

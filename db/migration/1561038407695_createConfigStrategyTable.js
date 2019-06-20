const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_config_' + coreConstants.environment;

const migrationName = {
  dbName: dbName,
  up: [
    'CREATE TABLE `config_strategies` (\n' +
      '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
      '  `kind` tinyint(4) NOT NULL,\n' +
      '  `status` tinyint(4) NOT NULL,\n' +
      '  `unencrypted_params` text COLLATE utf8_unicode_ci NOT NULL,\n' +
      '  `encrypted_params` text COLLATE utf8_unicode_ci,\n' +
      '  `global_salt_id` bigint(20) DEFAULT NULL,\n' +
      '  `created_at` int(11) NOT NULL,\n' +
      '  `updated_at` int(11) NOT NULL,\n' +
      '  PRIMARY KEY (`id`),\n' +
      '  UNIQUE KEY `uk_kind` (`kind`)\n' +
      ') ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;'
  ],
  down: ['DROP TABLE config_strategies']
};

module.exports = migrationName;

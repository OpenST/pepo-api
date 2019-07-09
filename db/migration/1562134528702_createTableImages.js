const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const upQuery =
  'CREATE TABLE `images` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `resolutions` text COLLATE utf8_unicode_ci, \n\
  `status` tinyint(4) unsigned NOT NULL, \n\
  `kind` tinyint(4) unsigned NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
   PRIMARY KEY (`id`) \n\
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'DROP table if exists images;';

const migrationName = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = migrationName;

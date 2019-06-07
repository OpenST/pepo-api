const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const upQuery =
  'CREATE TABLE `notifications` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `user_id` bigint(20) NOT NULL, \n\
      `kind` tinyint(4) NOT NULL, \n\
      `status` tinyint(4) NOT NULL, \n\
      `entity_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `entity_kind` tinyint(4) NOT NULL, \n\
      `extra_data` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      INDEX idx_1 (`user_id`,`status`,`kind`) \n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `notifications`;';
const migrationName = {
  dbName: 'pepo_api_' + coreConstants.environment,
  up: [upQuery],
  down: [downQuery]
};

module.exports = migrationName;

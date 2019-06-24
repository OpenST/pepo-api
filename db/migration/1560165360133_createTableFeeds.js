const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `feeds` (\n\
    `id` bigint(20) NOT NULL AUTO_INCREMENT,\n\
    `kind` tinyint(4) NOT NULL,\n\
    `primary_external_entity_id` bigint(20) NOT NULL,\n\
    `extra_data` text COLLATE utf8mb4_unicode_ci,\n\
    `status` tinyint(4) NOT NULL,\n\
    `published_ts` int(11) DEFAULT NULL,\n\
    `created_at` int(11) NOT NULL,\n\
    `updated_at` int(11) NOT NULL,\n\
    PRIMARY KEY (`id`),\n\
    KEY `idx_1` (`status`,`published_ts`)\n\
  ) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';

const downQuery = 'drop table if exists `feeds`;';

const createFeedsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createFeedsTable;

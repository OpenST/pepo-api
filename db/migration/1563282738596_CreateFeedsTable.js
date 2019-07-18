const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  "CREATE TABLE `feeds` (\n\
    `id` bigint(20) NOT NULL AUTO_INCREMENT,\n\
    `primary_external_entity_id` bigint(20) NOT NULL, \n\
    `kind` tinyint(4) NOT NULL,\n\
    `pagination_identifier` int(11) DEFAULT NULL,\n\
    `actor` int(11) NOT NULL DEFAULT '0',\n\
    `extra_data` text COLLATE utf8_unicode_ci, \n\
    `created_at` int(11) NOT NULL,\n\
    `updated_at` int(11) NOT NULL,\n\
    PRIMARY KEY (`id`),\n\
    KEY `idx_1` (`pagination_identifier`),\n\
    KEY `idx_2` (`actor`)\n\
  ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;";

const downQuery = 'drop table if exists `feeds`;';

const createFeedsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createFeedsTable;

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `feeds` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `kind` tinyint(4) NOT NULL, \n\
      `entity_kind` tinyint(4) NOT NULL, \n\
      `entity_id` varchar(40) NOT NULL, \n\
      `extra_data` TEXT COLLATE utf8_unicode_ci NOT NULL, \n\
      `status` tinyint(4) NOT NULL, \n\
      `published_ts` int(11) NOT NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      INDEX idx_1 (entity_kind,entity_id), \n\
      INDEX idx_2 (status,published_ts) \n\
) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `feeds`;';

const createFeedsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createFeedsTable;

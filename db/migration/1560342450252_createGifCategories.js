const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `gif_categories` ( \n\
      `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
      `name` varchar(40) NOT NULL, \n\
      `gif_id` varchar(40) NOT NULL, \n\
      `gif_data` TEXT COLLATE utf8_unicode_ci NOT NULL, \n\
      `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
      PRIMARY KEY (`id`), \n\
      INDEX idx_1 (name) \n\
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `gif_categories`;';

const createGifCategoriesTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createGifCategoriesTable;

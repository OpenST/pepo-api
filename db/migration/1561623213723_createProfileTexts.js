const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'CREATE TABLE `profile_texts` ( \n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
  `text` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`) \n\
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `profile_texts`;';

const createProfileTextsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createProfileTextsTable;

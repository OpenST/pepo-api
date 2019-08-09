const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.adminDbName;

const upQuery =
  'CREATE TABLE `admins` ( \n\
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT, \n\
  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `encryption_salt` blob NOT NULL, \n\
  `status` tinyint(4) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `admins`;';

const createAdminsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createAdminsTable;

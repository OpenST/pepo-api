const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `user_utm_details` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `user_id` bigint(20) NOT NULL,\
  `kind` tinyint(4) NOT NULL,\
  `utm_campaign` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,\
  `utm_medium` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,\
  `utm_source` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,\
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`),\
  UNIQUE uidx_1 (`user_id`, `kind`)\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `user_utm_details`;';

const createUserUtmDetails = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createUserUtmDetails;

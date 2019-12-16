const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.userDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `user_device_extended_details` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `device_id` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\
  `user_id` bigint(20) NOT NULL,\
  `build_number` tinyint(6),\
  `app_version` varchar(20), \n\
  `device_os` tinyint(4),\
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`),\
  UNIQUE uidx_1 (`device_id`, `user_id`)\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `user_device_extended_details`;';

const createUserDeviceExtendedDetails = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createUserDeviceExtendedDetails;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `user_devices` ( \n\
    `id` bigint(20) NOT NULL AUTO_INCREMENT,\n\
	  `user_id` bigint(20) unsigned NOT NULL, \n\
	  `device_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci, \n\
	  `device_token` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
	  `device_kind` tinyint(4) NOT NULL,\n\
	  `status` tinyint(4) NOT NULL,\n\
	  `created_at` int(11) NOT NULL,\n\
    `updated_at` int(11) NOT NULL,\n\
	  PRIMARY KEY (`id`), \n\
	  UNIQUE KEY `uidx_1` (`user_id`,`device_id`)\n\
	) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `user_devices`;';

const createUserDevicesTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createUserDevicesTable;

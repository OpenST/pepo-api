const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.adminDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `activity_logs` ( \n\
	  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
	  `admin_id` bigint(20) unsigned NOT NULL, \n\
	  `action` tinyint(4) NOT NULL, \n\
	  `data` int(11) NOT NULL, \n\
	  `created_at` int(11) NOT NULL, \n\
      `updated_at` int(11) NOT NULL, \n\
	  PRIMARY KEY (`id`) \n\
	) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `activity_logs`;';

const createActivityLogsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createActivityLogsTable;

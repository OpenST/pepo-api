const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `locations` ( \n\
    `id` bigint(20) NOT NULL AUTO_INCREMENT,\n\
	  `gmt_offset` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
	  `time_zone` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
	  `created_at` int(11) NOT NULL,\n\
    `updated_at` int(11) NOT NULL,\n\
	  PRIMARY KEY (`id`), \n\
	  UNIQUE KEY `uidx_1` (`time_zone`),\n\
	  INDEX `idx_1` (`gmt_offset`)) \
	  ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `locations`;';

const createLocationTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createLocationTable;

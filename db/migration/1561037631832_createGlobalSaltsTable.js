const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.bigDbName;
const dbKind = DbKindConstant.sqlDbKind;

const migrationName = {
  dbName: dbName,
  up: [
    'CREATE TABLE `global_salts` ( \n\
  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
  `kind` tinyint(4) NOT NULL, \n\
  `salt` blob NOT NULL, \n\
  `status` tinyint(4) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE KEY `uk_1` (`kind`, `status`) \n\
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;'
  ],
  down: ['DROP TABLE global_salts'],
  dbKind: dbKind
};

module.exports = migrationName;

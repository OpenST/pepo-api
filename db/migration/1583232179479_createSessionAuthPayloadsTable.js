const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.bigDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `session_auth_payloads` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `user_id` bigint(20) NOT NULL,\
  `payload` varchar(550) NOT NULL,\
  `status` tinyint(4) NOT NULL, \
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`) \
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `session_auth_payloads`;';

const createSessionAuthPayloadsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createSessionAuthPayloadsTable;

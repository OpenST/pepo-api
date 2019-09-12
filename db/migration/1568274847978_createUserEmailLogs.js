const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.bigDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `user_email_logs` ( \n\
    `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
    `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL, \n\
    `user_id` bigint(20) NULL, \n\
    `created_at` int(11) NOT NULL, \n\
    `updated_at` int(11) NOT NULL, \n\
    PRIMARY KEY (`id`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `user_email_logs`;';

const createTemporaryTokens = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createTemporaryTokens;

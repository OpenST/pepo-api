const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `invite_codes` ( \n\
	  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
	  `code` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
	  `invite_limit` int(11) NOT NULL,\n\
	  `invited_user_count` bigint(20) NOT NULL DEFAULT 0,\n\
	  `user_id` bigint(20) NULL,\n\
	  `inviter_code_id` bigint(20) NULL,\n\
    `created_at` int(11) NOT NULL, \n\
    `updated_at` int(11) NOT NULL, \n\
	  PRIMARY KEY (`id`), \n\
	  INDEX idx_1 (`inviter_code_id`),\n\
    UNIQUE KEY `idx_2` (`code`)\n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `invite_codes`;';

const createInviteCodesTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createInviteCodesTable;

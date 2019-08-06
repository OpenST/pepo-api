const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `user_tags` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `user_id` bigint(20) unsigned NOT NULL, \n\
  `tag_id` int(11) NOT NULL, \n\
  `kind` tinyint(4) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  UNIQUE uidx_1 (`user_id`, `tag_id`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `user_tags`;';

const createUserTagsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createUserTagsTable;

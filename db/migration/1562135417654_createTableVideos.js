const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `videos` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `resolutions` text COLLATE utf8_unicode_ci, \n\
  `status` tinyint(4) unsigned NOT NULL, \n\
  `poster_image_id` bigint(20) unsigned, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
   PRIMARY KEY (`id`) \n\
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'DROP table if exists videos;';

const migrationName = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = migrationName;

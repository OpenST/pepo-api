const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `video_tags` (\n\
    `id` bigint(20) NOT NULL AUTO_INCREMENT,\n\
    `tag_id` int(11) NOT NULL, \n\
    `video_id` int(11) NOT NULL,\n\
    `created_at` int(11) NOT NULL,\n\
    `updated_at` int(11) NOT NULL,\n\
    PRIMARY KEY (`id`),\n\
    UNIQUE uidx_1 (`tag_id`, `video_id`)\n\
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `video_tags`;';

const CreateVideoTags = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = CreateVideoTags;

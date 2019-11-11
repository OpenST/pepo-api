const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `video_tags` \n\
      ADD COLUMN `video_kind` tinyint(4) NOT NULL DEFAULT 1 AFTER `video_id`;';

const downQuery = 'ALTER TABLE `video_tags` DROP `video_kind`;';

const addColumnVideoKindInVideoTags = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnVideoKindInVideoTags;

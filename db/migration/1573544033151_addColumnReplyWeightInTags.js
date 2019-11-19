const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `tags` \n\
      ADD COLUMN `reply_weight` bigint(20) NOT NULL DEFAULT 0 AFTER `video_weight`;';

const downQuery = 'ALTER TABLE `tags` DROP `reply_weight`;';

const addColumnReplyWeightInTags = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};
module.exports = addColumnReplyWeightInTags;

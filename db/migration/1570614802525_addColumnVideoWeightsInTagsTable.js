const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'ALTER TABLE `tags` \n\
      ADD COLUMN `video_weight` bigint(20) NOT NULL DEFAULT 0 AFTER `weight`;';

const downQuery = 'ALTER TABLE `tags` DROP `video_weight`;';

const addVideoTagsToTags = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addVideoTagsToTags;

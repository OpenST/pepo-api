const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.channelDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `channels` \n\
      ADD COLUMN `trending_rank` int(11) NULL AFTER `permalink`, \n\
      ADD INDEX idx_trending_rank (`trending_rank`) \n\
      ';

const downQuery = 'ALTER TABLE `channels` \n\
  DROP COLUMN `trending_rank` , \n\
  DROP INDEX `idx_trending_rank`';

const addTrendingRank = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};
module.exports = addTrendingRank;

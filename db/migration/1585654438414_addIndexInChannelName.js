const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.channelDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `channels` \n\
      ADD INDEX idx_name (`name`)\n\
      ';

const downQuery = 'ALTER TABLE `channels` \n\
  DROP INDEX `idx_name`';

const addIndexInChannelName = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};
module.exports = addIndexInChannelName;

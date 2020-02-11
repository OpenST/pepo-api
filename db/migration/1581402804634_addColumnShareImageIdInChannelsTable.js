const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.channelDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `channels` \n\
      ADD COLUMN `share_image_id` bigint(20) NULL AFTER `cover_image_id`';

const downQuery = 'ALTER TABLE `channels` DROP `share_image_id`;';
const addColumnShareImageIdInChannelsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnShareImageIdInChannelsTable;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `video_details` \n\
      ADD COLUMN `description_id` int(11) NOT NULL AFTER `video_id`;';

const downQuery = 'ALTER TABLE `video_details` DROP `description_id`;';

const AddColumnDescriptionIdInVideoDetails = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = AddColumnDescriptionIdInVideoDetails;

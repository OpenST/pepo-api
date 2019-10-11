const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `video_details` \n\
      ADD COLUMN `status` tinyint(4) NOT NULL  AFTER `total_transactions`;';

const downQuery = 'ALTER TABLE `video_details` DROP `status`;';

const addStatusToVideoDetails = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addStatusToVideoDetails;

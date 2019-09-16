const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `video_details` \n\
   	ALTER `status` SET DEFAULT 1;';

const downQuery = 'ALTER TABLE `video_details` ALTER `status` DROP DEFAULT;';

const addDefaultStatusToVideoDetails = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addDefaultStatusToVideoDetails;

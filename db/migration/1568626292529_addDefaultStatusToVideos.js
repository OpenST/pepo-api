const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `videos` \n\
   	ALTER `status` SET DEFAULT 	1;';

const downQuery = 'ALTER TABLE `videos` ALTER `status` DROP DEFAULT;';

const addDefaultStatusToVideos = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addDefaultStatusToVideos;

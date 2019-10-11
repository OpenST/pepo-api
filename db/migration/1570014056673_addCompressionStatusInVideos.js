const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'ALTER TABLE `videos` \n\
      ADD COLUMN `compression_status` tinyint(4) NOT NULL DEFAULT 1 AFTER `status`;';

const downQuery = 'ALTER TABLE `videos` DROP `compression_status`;';

const addCompressionStatusToVideos = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addCompressionStatusToVideos;

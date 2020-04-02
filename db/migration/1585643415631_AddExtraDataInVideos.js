const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `videos` \n\
      ADD COLUMN `extra_data` varchar(255) AFTER `resolutions`;';

const downQuery = 'ALTER TABLE `videos` DROP `extra_data` ;';

const AddExtraDataInVideos = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = AddExtraDataInVideos;

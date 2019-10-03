const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'ALTER TABLE `images` \n\
      ADD COLUMN `resize_status` tinyint(4) NOT NULL DEFAULT 1 AFTER `status`;';

const downQuery = 'ALTER TABLE `images` DROP `resize_status`;';

const addResizeStatusToImages = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addResizeStatusToImages;

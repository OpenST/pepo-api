const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;
const dbKind = dbKindConstants.sqlDbKind;

// TODO - replies - default value should be removed in another code push when everything becomes stable.
const upQuery = 'ALTER TABLE `videos` \n\
      ADD COLUMN `kind` tinyint(4) NOT NULL DEFAULT 1 AFTER `status`;';

const downQuery = 'ALTER TABLE `videos` DROP `kind`;';

const addColumnKindInVideosTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnKindInVideosTable;

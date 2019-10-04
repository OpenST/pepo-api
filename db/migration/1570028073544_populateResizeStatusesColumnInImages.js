const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'UPDATE `images` SET resize_status = status;';

const downQuery = 'SELECT `*` from `images` LIMIT 1;'; // Intentionally did not create a down query.

const populateResizeStatusesColumnInImages = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = populateResizeStatusesColumnInImages;

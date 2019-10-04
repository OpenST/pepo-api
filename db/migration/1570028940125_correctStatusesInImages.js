const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'UPDATE `images` SET status = 1;';

const downQuery = 'SELECT `*` from `images` LIMIT 1;'; // Intentionally did not create a down query.

const correctStatusesInImages = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = correctStatusesInImages;

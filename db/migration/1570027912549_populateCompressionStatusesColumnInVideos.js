const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'UPDATE `videos` SET `compression_status` = `status` WHERE (status != 5);';

const downQuery = 'SELECT `*` from `videos` LIMIT 1;'; // Intentionally did not create a down query.

const populateCompressionStatusesColumnInVideos = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = populateCompressionStatusesColumnInVideos;

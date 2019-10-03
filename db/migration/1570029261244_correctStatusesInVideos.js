const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'UPDATE `videos` \n\
      SET `status` = CASE \n\
       WHEN `status` = 5 THEN 2 \n\
       ELSE 1\
       END;';

const downQuery = 'SELECT `*` from `videos` LIMIT 1;'; // Intentionally did not create a down query.

const correctStatusesInVideos = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = correctStatusesInVideos;

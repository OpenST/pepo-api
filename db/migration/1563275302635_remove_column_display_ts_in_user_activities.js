const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.feedDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `user_activities` \n\
      DROP COLUMN `display_ts`;';

const downQuery = 'ALTER TABLE `user_activities` ADD COLUMN `display_ts` int(11) NOT NULL AFTER published_ts;';

const removeColumnDisplayTsInUserActivities = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = removeColumnDisplayTsInUserActivities;

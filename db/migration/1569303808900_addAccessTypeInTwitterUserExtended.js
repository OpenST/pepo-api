const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.twitterDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  "ALTER TABLE `twitter_users_extended` \n\
      ADD COLUMN `access_type` tinyint(4) NOT NULL DEFAULT '0' AFTER `secret`; ";

const downQuery = 'ALTER TABLE `twitter_users_extended` DROP `access_type`;';

const addAccessTypeInTwitterUserExtended = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addAccessTypeInTwitterUserExtended;

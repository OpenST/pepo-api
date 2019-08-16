const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.twitterDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `twitter_users` \n\
      MODIFY `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL, \n\
      DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';

const downQuery =
  'ALTER TABLE `twitter_users` \n\
      MODIFY `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\n\
      DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const alterColumnNameCollation = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = alterColumnNameCollation;

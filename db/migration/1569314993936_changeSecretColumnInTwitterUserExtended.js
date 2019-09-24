const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.twitterDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `twitter_users_extended` \n\
      MODIFY `secret` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL; ';

const downQuery =
  'ALTER TABLE `twitter_users_extended` \n\
  MODIFY `secret` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL;';

const changeSecretColumnInTwitterUserExtended = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = changeSecretColumnInTwitterUserExtended;

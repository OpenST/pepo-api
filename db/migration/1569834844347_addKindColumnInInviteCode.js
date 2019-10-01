const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `invite_codes` \n\
      ADD COLUMN `kind` SMALLINT NOT NULL DEFAULT 0 AFTER `code`; ';

const downQuery = 'ALTER TABLE `invite_codes` DROP `kind`;';

const addKindColumnInInviteCode = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addKindColumnInInviteCode;

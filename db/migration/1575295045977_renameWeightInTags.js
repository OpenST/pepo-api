const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'alter table tags change weight user_bio_weight bigint(20) NOT NULL;';

const downQuery = 'alter table tags change user_bio_weight weight bigint(20) NOT NULL;';

const RenameWeightInTags = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = RenameWeightInTags;

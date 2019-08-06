const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `texts` ADD COLUMN `tag_ids` varchar(255) COLLATE utf8mb4_unicode_ci NULL AFTER `text`;';

const downQuery = 'ALTER TABLE `texts` DROP `tag_ids`;';

const updateTextsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = updateTextsTable;

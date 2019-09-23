const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'drop table if exists `gif_categories`;';

const deleteGifCategoriesTable = {
  dbName: dbName,
  up: [upQuery],
  down: [],
  dbKind: dbKind
};

module.exports = deleteGifCategoriesTable;

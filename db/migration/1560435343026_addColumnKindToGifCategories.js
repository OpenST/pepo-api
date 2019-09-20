const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `gif_categories` \n\
      ADD COLUMN `kind` tinyint(4) NOT NULL  AFTER `name`;';

const downQuery = 'ALTER TABLE `gif_categories` DROP `kind`;';

const addKindToGifCategories = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addKindToGifCategories;

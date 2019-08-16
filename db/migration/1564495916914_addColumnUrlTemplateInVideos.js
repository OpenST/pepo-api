const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `videos` \n\
      ADD COLUMN `url_template` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci AFTER `id`;';

const downQuery = 'ALTER TABLE `videos` DROP `url_template`;';

const addColumnUrlTemplateInImages = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnUrlTemplateInImages;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.entityDbName;

const upQuery =
  'ALTER TABLE `images` \n\
      ADD COLUMN `url_template` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci AFTER `id`;';

const downQuery = 'ALTER TABLE `images` DROP `url_template`;';

const addColumnUrlTemplateInImages = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addColumnUrlTemplateInImages;

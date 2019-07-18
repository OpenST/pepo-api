const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.entityDbName;

const upQuery = 'ALTER TABLE `texts` ADD COLUMN `tag_ids` varchar(255) COLLATE utf8_unicode_ci NULL AFTER `text`;';

const downQuery = 'ALTER TABLE `texts` DROP `tag_ids`;';

const updateTextsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = updateTextsTable;

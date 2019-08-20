const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `texts` \n\
      ADD COLUMN `link_ids` varchar(255) AFTER `tag_ids`, \n\
      ADD COLUMN `kind` tinyint(4) NOT NULL DEFAULT 0 AFTER `link_ids`;';

const downQuery = 'ALTER TABLE `texts` DROP `link_ids`, DROP `kind`;';

const AddColumnKindAndLinkIdsInText = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = AddColumnKindAndLinkIdsInText;

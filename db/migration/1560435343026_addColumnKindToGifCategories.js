const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery = 'ALTER TABLE `gif_categories` \n\
      ADD COLUMN `kind` tinyint(4) NOT NULL  AFTER `name`;';

const downQuery = 'ALTER TABLE `gif_categories` DROP `kind`;';

const addKindToGifCategories = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addKindToGifCategories;

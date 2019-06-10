const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;
const upQuery =
  'ALTER TABLE `users` \n\
      ADD COLUMN `first_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL AFTER `user_name`, \n\
      ADD COLUMN `last_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL AFTER `first_name`;';

const downQuery = 'ALTER TABLE `users` DROP `first_name`,DROP `last_name`;';

const addFirstNameLastNameInUsers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = addFirstNameLastNameInUsers;

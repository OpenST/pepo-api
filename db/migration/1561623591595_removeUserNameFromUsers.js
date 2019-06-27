const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const upQuery = 'ALTER TABLE `users` DROP `user_name`;';

const downQuery =
  'ALTER TABLE `users` \n\
      ADD COLUMN `user_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci';

const removeUserNameFromUsers = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = removeUserNameFromUsers;

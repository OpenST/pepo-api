const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const upQuery =
  'ALTER TABLE `users` \n\
      MODIFY `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL, \n\
      ADD COLUMN `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL AFTER `id`,\n\
      DROP `first_name`, \n\
      DROP `last_name`, \n\
      ADD COLUMN `user_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL AFTER `id`,\n\
      ADD COLUMN `profile_image_id` bigint(20)  NOT NULL AFTER `status`,\n\
      ADD UNIQUE  `uk_idx_1` (`user_name`);';

const downQuery =
  'ALTER TABLE `users` \n\
      MODIFY `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL, \n\
      DROP `name`,\n\
      ADD COLUMN `first_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL AFTER `id`, \n\
      ADD COLUMN `last_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL AFTER `id`, \n\
      DROP `user_name`,\n\
      DROP INDEX `uk_idx_1`,\n\
      DROP `profile_image_id`;';

const migrationName = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = migrationName;

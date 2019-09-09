const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.userDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `pre_launch_invites` ( \n\
	  `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
	  `encryption_salt` blob NOT NULL, \n\
    `twitter_id` bigint(20) NOT NULL, \n\
	  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL,\n\
    `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\n\
    `profile_image_url` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL, \n\
    `token` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\n\
    `secret` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\n\
    `status` tinyint(4) NOT NULL,\n\
    `inviter_user_id` bigint(20) NULL,\n\
    `invite_code` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,\n\
    `invited_user_count` bigint(20) NOT NULL,\n\
    `created_at` int(11) NOT NULL, \n\
    `updated_at` int(11) NOT NULL, \n\
	  PRIMARY KEY (`id`), \n\
	  UNIQUE KEY `uk_event_id` (`invite_code`),\n\
	  UNIQUE KEY `uk_twitter_id` (`twitter_id`), \n\
	  UNIQUE KEY `uk_email` (`email`) \n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `pre_launch_invites`;';

const createPreLaunchInvites = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createPreLaunchInvites;

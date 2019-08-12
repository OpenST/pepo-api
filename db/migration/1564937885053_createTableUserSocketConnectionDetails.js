const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.socketDbName;

const upQuery =
  'CREATE TABLE `user_socket_connection_details` ( \n\
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \n\
  `user_id` bigint(20) unsigned NOT NULL, \n\
  `auth_key` varchar(255) COLLATE utf8_unicode_ci, \n\
  `socket_identifier` varchar(255) DEFAULT NULL, \n\
  `auth_key_expiry_at` int(11) DEFAULT NULL, \n\
  `status` tinyint(4) NOT NULL, \n\
  `created_at` int(11) NOT NULL, \n\
  `updated_at` int(11) NOT NULL, \n\
  PRIMARY KEY (`id`), \n\
  INDEX idx_1 (`user_id`), \n\
  INDEX idx_2 (`user_id`, `status`)\n\
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci';

const downQuery = 'drop table if exists `user_socket_connection_details`;';

const createUserSocketConnectionDetails = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = createUserSocketConnectionDetails;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.channelDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `channels` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL, \n\
  `status` tinyint(4) NOT NULL,\
  `description_id` bigint(20) NOT NULL,\n\
  `image_id` bigint(20) NOT NULL,\n\
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`),\
  UNIQUE uidx_1 (`name`)\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `channels`;';

const createChannels = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createChannels;

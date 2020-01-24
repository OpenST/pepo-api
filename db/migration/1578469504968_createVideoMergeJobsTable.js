const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.bigDbName;
const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  'CREATE TABLE `video_merge_jobs` (\
  `id` bigint(20) NOT NULL AUTO_INCREMENT,\
  `user_id` bigint(20) NOT NULL,\
  `merged_url` varchar(255) DEFAULT NULL,\
  `status` tinyint(4) NOT NULL,\
  `created_at` int(11) NOT NULL,\
  `updated_at` int(11) NOT NULL,\
  PRIMARY KEY (`id`)\
  ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `video_merge_jobs`;';

const createVideoMergeJobsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createVideoMergeJobsTable;

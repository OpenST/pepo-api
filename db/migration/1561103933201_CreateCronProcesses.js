const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.bigDbName;

const upQuery =
  'CREATE TABLE `cron_processes` (\n' +
  '  `id` bigint(20) NOT NULL AUTO_INCREMENT,\n' +
  '  `kind` tinyint(4) NOT NULL,\n' +
  '  `kind_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
  '  `ip_address` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
  '  `params` text COLLATE utf8_unicode_ci,\n' +
  '  `status` tinyint(4) NOT NULL,\n' +
  '  `last_started_at` datetime DEFAULT NULL,\n' +
  '  `last_ended_at` datetime DEFAULT NULL,\n' +
  '  `created_at` int(11) NOT NULL,\n' +
  '  `updated_at` int(11) NOT NULL,\n' +
  '  PRIMARY KEY (`id`)\n' +
  ') ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `cron_processes`;';

const CreateCronProcessesTable = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = CreateCronProcessesTable;

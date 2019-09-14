const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.bigDbName;

const dbKind = dbKindConstants.sqlDbKind;

const upQuery =
  "ALTER TABLE `aggregated_notifications` \n\
    DROP `location_id`,\n\
    ADD COLUMN `send_time` int(11) NOT NULL DEFAULT '0' AFTER `user_id`,\n\
    ADD INDEX  `nu_st_st_1` (`status`, `send_time`);";

const downQuery =
  'ALTER TABLE `aggregated_notifications` \n\
    DROP COLUMN `send_time`, \n\
    ADD COLUMN `location_id` int(11) NOT NULL AFTER `user_id`, \n\
    DROP INDEX  `nu_st_st_1`';

const addSendTimeInAggregatedNotification = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addSendTimeInAggregatedNotification;

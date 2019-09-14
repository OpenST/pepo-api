const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.bigDbName;

const dbKind = dbKindConstants.sqlDbKind;

const upQuery = 'ALTER TABLE `aggregated_notifications` \n\
    DROP INDEX `uidx_1`';

const downQuery = 'ALTER TABLE `aggregated_notifications` \n\
    ADD INDEX  `uidx_1` (`status`, `location_id`)';

const addSendTimeInAggregatedNotification = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addSendTimeInAggregatedNotification;

const rootPrefix = '../..',
  cassandraKeyspaceConstant = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

let keySpace = cassandraKeyspaceConstant.cassandraKeyspaceName;

const dbKind = DbKindConstant.cassandraDbKind;

const upQuery = `ALTER TABLE ${keySpace}.user_notification_visit_details \n\
  ADD latest_seen_feed_time timestamp;`;

const downQuery = `ALTER TABLE ${keySpace}.user_notification_visit_details DROP latest_seen_feed_time;`;

const addColumnInUserNotificationVisitDetail = {
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind,
  keySpace: keySpace
};

module.exports = addColumnInUserNotificationVisitDetail;

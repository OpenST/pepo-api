const rootPrefix = '../..',
  cassandraKeyspaceConstant = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = '';

const keySpace = cassandraKeyspaceConstant.cassandraKeyspaceName;

const dbKind = DbKindConstant.cassandraDbKind;

const upQuery = `CREATE TABLE ${keySpace}.user_notification_visit_details \n\
( \n\
  user_id bigint,\n\
  unread_flag boolean,\n\
  PRIMARY KEY ((user_id))\n\
);`;

const downQuery = `drop table if exists ${keySpace}.user_notification_visit_details;`;

const createUserNotificationVisitDetails = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind,
  keySpace: keySpace
};

module.exports = createUserNotificationVisitDetails;

const rootPrefix = '../..',
  cassandraKeyspaceConstant = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const keySpace = cassandraKeyspaceConstant.cassandraKeyspaceName;

const dbKind = DbKindConstant.cassandraDbKind;

const upQuery = `CREATE TABLE ${keySpace}.user_notification_count \n\
(  \n\
  user_id bigint, \n\
  unread_notification_count counter, \n\
  PRIMARY KEY ((user_id)) \n\
);`;

const downQuery = `drop table if exists ${keySpace}.user_notification_count;`;

const createUserNotificationsCount = {
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind,
  keySpace: keySpace
};

module.exports = createUserNotificationsCount;

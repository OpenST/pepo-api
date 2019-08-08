const rootPrefix = '../..',
  cassandraKeyspaceConstant = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const keySpace = cassandraKeyspaceConstant.cassandraKeyspaceName;

const dbKind = DbKindConstant.cassandraDbKind;

const upQuery = `CREATE TABLE ${keySpace}.user_notifications \n\
(  \n\
  user_id bigint, \n\
  last_action_timestamp timestamp, \n\
  uuid varchar, \n\
  kind int, \n\
  subject_user_id bigint, \n\
  actor_ids SET<INT>, \n\
  actor_count INT, \n\
  payload varchar, \n\
  heading_version smallint, \n\
  flag_1 tinyint, \n\
  flag_2 tinyint, \n\
  column_1 varchar, \n\
  column_2 varchar, \n\
  PRIMARY KEY ((user_id), last_action_timestamp, uuid) \n\
) WITH CLUSTERING ORDER BY (last_action_timestamp DESC);`;

const downQuery = `drop table if exists ${keySpace}.user_notifications;`;

const createUserNotifications = {
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind,
  keySpace: keySpace
};

module.exports = createUserNotifications;

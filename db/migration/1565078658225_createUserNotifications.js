const rootPrefix = '../..',
  keySpaceConstant = require(rootPrefix + '/lib/globalConstant/keySpace'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = '';

let keySpace = keySpaceConstant.mainKeySpace;

const dbKind = DbKindConstant.cassandraDbKind;

const upQuery = `CREATE TABLE ${keySpace}.user_notifications \n\
(  \n\
  user_id bigint, \n\
  last_action_timestamp timestamp, \n\
  uuid uuid, \n\
  kind smallint, \n\
  landing_vars varchar, \n\
  subject_user_id bigint, \n\
  heading varchar, \n\
  actor_ids SET<INT>, \n\
  actor_count INT, \n\
  transaction_id varchar, \n\
  video_id bigint, \n\
  PRIMARY KEY ((user_id), last_action_timestamp, uuid) \n\
) WITH CLUSTERING ORDER BY (last_action_timestamp DESC);`;

const downQuery = `drop table if exists ${keySpace}.user_notifications;`;

const createUserNotifications = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind,
  keySpace: keySpace
};

module.exports = createUserNotifications;

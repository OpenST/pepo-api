const rootPrefix = '../..',
  cassandraKeyspaceConstant = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

let keySpace = cassandraKeyspaceConstant.cassandraKeyspaceName;

const dbKind = DbKindConstant.cassandraDbKind;

const upQuery = `CREATE TABLE ${keySpace}.user_video_views \n\
( \n\
  user_id bigint,\n\
  video_id bigint, \n\
  last_view_at timestamp,\n\
  PRIMARY KEY ((user_id), video_id)\n\
)`;

const downQuery = `drop table if exists ${keySpace}.user_video_views;`;

const createUserVideoViews = {
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind,
  keySpace: keySpace
};

module.exports = createUserVideoViews;

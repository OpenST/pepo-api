const rootPrefix = '../..',
  cassandraKeyspaceConstant = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

let keySpace = cassandraKeyspaceConstant.cassandraKeyspaceName;

const dbKind = DbKindConstant.cassandraDbKind;

const upQuery = `ALTER TABLE ${keySpace}.user_video_views \n\
  ADD republished_at timestamp`;

const downQuery = `ALTER TABLE ${keySpace}.user_video_views DROP republished_at;`;

const AddColumnRepublishedAtInUserVideoView = {
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind,
  keySpace: keySpace
};

module.exports = AddColumnRepublishedAtInUserVideoView;

const rootPrefix = '../..',
  cassandraKeyspaceConstant = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const keySpace = cassandraKeyspaceConstant.cassandraKeyspaceName;

const dbKind = DbKindConstant.cassandraDbKind;

const upQuery = `CREATE TABLE ${keySpace}.user_action_details \n\
(  \n\
  u_id bigint, \n\
  e_i varchar, \n\
  l_r_t timestamp, \n\
  l_r_c_t timestamp, \n\
  l_v_c_t timestamp, \n\
  u_c_t timestamp, \n\
  PRIMARY KEY ((u_id), e_i)\n\
);`;

//   u_id: 'userId',
//   e_i: 'entityIdentifier',
//   l_r_t: 'lastReplyTimestamp',
//   l_r_c_t: 'lastReplyContributionTimestamp',
//   l_v_c_t: 'lastVideoContributionTimestamp',
//   u_c_t: 'userContributionTimestamp'

const downQuery = `drop table if exists ${keySpace}.user_action_details;`;

const CreateTableUserActionDetails = {
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind,
  keySpace: keySpace
};

module.exports = CreateTableUserActionDetails;

const rootPrefix = '../..',
  cassandraKeyspaceConstant = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

let keySpace = cassandraKeyspaceConstant.cassandraKeyspaceName;

const dbKind = DbKindConstant.cassandraDbKind;

const upQuery = `CREATE TABLE ${keySpace}.user_personalized_data \n\
( \n\
  user_id bigint,\n\
  kind int, \n\
  unique_id varchar, \n\
  json_data varchar,\n\
  PRIMARY KEY ((user_id, kind), unique_id)\n\
)`;

const downQuery = `drop table if exists ${keySpace}.user_personalized_data;`;

const createUserPersonalizedData = {
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind,
  keySpace: keySpace
};

module.exports = createUserPersonalizedData;

const rootPrefix = '../..',
  cassandraKeyspaceConstant = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const keySpace = cassandraKeyspaceConstant.cassandraKeyspaceName;

const dbKind = DbKindConstant.cassandraDbKind;

const upQuery = `CREATE TABLE ${keySpace}.text_includes \n\
(  \n\
  text_id bigint, \n\
  entity_identifier varchar, \n\
  replaceable_text varchar, \n\
  PRIMARY KEY ((text_id), entity_identifier)\n\
);`;

const downQuery = `drop table if exists ${keySpace}.text_includes;`;

const createTextIncludes = {
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind,
  keySpace: keySpace
};

module.exports = createTextIncludes;

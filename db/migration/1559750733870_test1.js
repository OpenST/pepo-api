const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const dbName = 'pepo_api_' + coreConstants.environment;

const m = {
  dbName: dbName,
  up: ['SELECT * from schema_migrations;'],
  down: ['SELECT * from schema_migrations;']
};

module.exports = m;

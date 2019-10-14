const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.redemptionDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE PRODUCTS \n\
   ADD COLUMN dollar_step DECIMAL(11,2) NOT NULL DEFAULT 1 AFTER min_dollar_value;';

const downQuery = 'ALTER TABLE PRODUCTS DROP COLUMN dollar_step;';

const addMinDollarValueToProducts = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addMinDollarValueToProducts;

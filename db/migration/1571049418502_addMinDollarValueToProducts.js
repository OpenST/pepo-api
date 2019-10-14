const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.redemptionDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  "ALTER TABLE PRODUCTS \n\
   ADD COLUMN min_dollar_value DECIMAL(21,2) NOT NULL DEFAULT '10.00' AFTER dollar_value;";

const downQuery = 'ALTER TABLE PRODUCTS DROP COLUMN min_dollar_value;';

const addMinDollarValueToProducts = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addMinDollarValueToProducts;

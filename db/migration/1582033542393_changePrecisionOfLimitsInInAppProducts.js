const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.fiatDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `in_app_products` \n\
      MODIFY `lower_limit` float(10,5) NOT NULL, \n\
      MODIFY `upper_limit` float(10,5) NOT NULL';

const modifyInAppProductsTable = {
  dbName: dbName,
  up: [upQuery],
  down: [],
  dbKind: dbKind
};

module.exports = modifyInAppProductsTable;

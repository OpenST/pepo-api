const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.redemptionDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  "INSERT INTO `products` (`id`, `kind`, `status`, `created_at`, `updated_at`) \n\
VALUES \n\
(1, 'AMAZON', 1, 1568608359, 1568608359), \n\
  (2, 'STARBUCKS', 1, 1568608359, 1568608359), \n\
  (3, 'NETFLIX', 1, 1568608359, 1568608359), \n\
  (4, 'AIRBNB', 1, 1568608359, 1568608359), \n\
  (5, 'CREATOR_PARTNERS', 1, 1568608359, 1568608359), \n\
  (6, 'UBER', 1, 1568608359, 1568608359);";

const populateRedemptionProductsMigration = {
  dbName: dbName,
  up: [upQuery],
  down: [],
  dbKind: dbKind
};

module.exports = populateRedemptionProductsMigration;

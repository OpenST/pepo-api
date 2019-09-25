const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.redemptionDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'INSERT INTO `products` (`id`, `kind`, `images`, `dollar_value`, `status`, `created_at`, `updated_at`) \n\
VALUES \n\
(1, \'AMAZON\', \'{"square":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-amazon-1x1.png","landscape":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-amazon-16x9.png"}\', 10.00, 1, 1568608359, 1568608359), \n\
  (2, \'STARBUCKS\', \'{"square":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-starbucks-1x1.png","landscape":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-starbucks-16x9.png"}\', 10.00, 1, 1568608359, 1568608359), \n\
  (3, \'NETFLIX\', \'{"square":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-netflix-1x1.png","landscape":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-netflix-16x9.png"}\', 10.00, 1, 1568608359, 1568608359), \n\
  (4, \'AIRBNB\', \'{"square":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-airbnb-1x1.png","landscape":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-airbnb-16x9.png"}\', 10.00, 1, 1568608359, 1568608359), \n\
  (5, \'GRAB\', \'{"square":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-grab-1x1.png","landscape":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-grab-16x9.png"}\', 10.00, 1, 1568608359, 1568608359), \n\
  (6, \'UBER\', \'{"square":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-uber-1x1.png","landscape":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-uber-16x9.png"}\', 10.00, 1, 1568608359, 1568608359);';

const populateRedemptionProductsMigration = {
  dbName: dbName,
  up: [upQuery],
  down: [],
  dbKind: dbKind
};

module.exports = populateRedemptionProductsMigration;

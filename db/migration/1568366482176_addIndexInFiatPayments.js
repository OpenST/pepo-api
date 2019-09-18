const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.fiatDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery = 'ALTER TABLE `fiat_payments` \n\
      ADD INDEX `idx_user_id_status` (`from_user_id`, `status`);';

const downQuery = 'ALTER TABLE `fiat_payments` DROP INDEX `idx_user_id_status`;';

const addIndexInFiatPayments = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addIndexInFiatPayments;

const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.fiatDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery1 = 'ALTER TABLE `fiat_payments` \n\
      DROP INDEX `receipt_id_service_kind_uniq`;';

const upQuery2 =
  'ALTER TABLE `fiat_payments` \n\
      ADD UNIQUE INDEX `receipt_id_service_kind_uniq` (`receipt_id`,`service_kind`);';

const downQuery = 'ALTER TABLE `fiat_payments` DROP INDEX `receipt_id_service_kind_uniq`;';

const modifyIndexInFiatPayments = {
  dbName: dbName,
  up: [upQuery1, upQuery2],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = modifyIndexInFiatPayments;

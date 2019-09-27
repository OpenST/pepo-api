const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.fiatDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `fiat_payments` \n\
      ADD COLUMN `error_data` text COLLATE utf8_unicode_ci  AFTER `decrypted_receipt`, \n\
      ADD COLUMN `retry_after` int(11)  AFTER `status`,\n\
      ADD COLUMN `retry_count` SMALLINT NOT NULL DEFAULT 0 AFTER `retry_after`; ';

const downQuery = 'ALTER TABLE `fiat_payments` DROP `retry_count`, DROP `retry_after`, DROP `error_data`;';

const addColumnInFiatPayments = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnInFiatPayments;

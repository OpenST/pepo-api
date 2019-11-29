const rootPrefix = '../..',
  dbKindConstants = require(rootPrefix + '/lib/globalConstant/dbKind'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database');

const dbName = databaseConstants.entityDbName;

const dbKind = dbKindConstants.sqlDbKind;

const upQuery1 = 'ALTER TABLE `reply_details` \n\
      ADD INDEX `in_1` (`parent_id`, `parent_kind`);';

const upQuery2 = 'ALTER TABLE `reply_details` \n\
      ADD INDEX `in_2` (`creator_user_id`);';

const downQuery1 = 'ALTER TABLE `reply_details` DROP INDEX `in_1`;';
const downQuery2 = 'ALTER TABLE `reply_details` DROP INDEX `in_2`;';

const modifyIndexInFiatPayments = {
  dbName: dbName,
  up: [upQuery1, upQuery2],
  down: [downQuery1, downQuery2],
  dbKind: dbKind
};

module.exports = modifyIndexInFiatPayments;

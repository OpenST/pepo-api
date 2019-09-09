const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.bigDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `notification_hooks` \n\
      ADD COLUMN `retry_count` int(11) NOT NULL DEFAULT 0 AFTER `locked_at`, \
      ADD COLUMN `response` text COLLATE utf8_unicode_ci AFTER `retry_count`; ';

const downQuery = 'ALTER TABLE `notification_hooks` DROP `response`, DROP `retry_count`;';

const AddColumnsInNotificationHooks = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = AddColumnsInNotificationHooks;

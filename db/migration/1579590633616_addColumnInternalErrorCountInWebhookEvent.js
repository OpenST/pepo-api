const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.webhookDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `webhook_events` \n\
      ADD COLUMN `internal_error_count` tinyint(4) NOT NULL DEFAULT 0 AFTER `retry_count`';

const downQuery = 'ALTER TABLE `webhook_events` DROP `internal_error_count`;';
const addColumnInternalErrorCountInWebhookEvent = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnInternalErrorCountInWebhookEvent;

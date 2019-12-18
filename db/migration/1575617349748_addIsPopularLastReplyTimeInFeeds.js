const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.feedDbName;

const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `feeds` \n\
      ADD COLUMN `is_popular` tinyint(4) NOT NULL DEFAULT 0 AFTER `actor`, \n\
      ADD COLUMN `last_reply_timestamp` int(11) AFTER `is_popular`;';

const downQuery = 'ALTER TABLE `feeds` DROP `last_reply_timestamp`, DROP `is_popular`;';

const addIsPopularLastReplyTimeInFeeds = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addIsPopularLastReplyTimeInFeeds;

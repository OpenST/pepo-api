const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'ALTER TABLE `video_details` \n\
      ADD COLUMN `per_reply_amount_in_wei` decimal(30,0) NOT NULL DEFAULT 0 AFTER `total_amount`, \n\
      ADD COLUMN `total_replies` int(11) NOT NULL DEFAULT 0 AFTER `per_reply_amount_in_Wei`;';

const downQuery = 'ALTER TABLE `video_details` DROP `per_reply_amount_in_Wei`, DROP `total_replies`;';

const addColumnPerReplyAmountInWieAndTotalRepliesInVideoDetails = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = addColumnPerReplyAmountInWieAndTotalRepliesInVideoDetails;

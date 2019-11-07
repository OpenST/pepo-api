const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind');

const dbName = database.entityDbName;
const dbKind = DbKindConstant.sqlDbKind;

const upQuery =
  'CREATE TABLE `reply_details` ( \n\
        `id` bigint(20) NOT NULL AUTO_INCREMENT, \n\
        `creator_user_id` bigint(20) NOT NULL,\n\
        `entity_id` bigint(20) NOT NULL,\n\
        `entity_kind` tinyint(4) NOT NULL, \n\
        `parent_kind` tinyint(4) NOT NULL, \n\
        `parent_id` bigint(20) NOT NULL, \n\
        `description_id` int(11) NULL,\n\
        `link_ids` varchar(255) NULL, \n\
        `transaction_id` int(11) NOT NULL, \n\
        `total_contributed_by` int(11) NOT NULL DEFAULT 0, \n\
        `total_amount` decimal(30,0) NOT NULL  DEFAULT 0, \n\
        `total_transactions` int(11) NOT NULL DEFAULT 0, \n\
        `status` tinyint(4) NOT NULL, \n\
        `created_at` int(11) NOT NULL, \n\
        `updated_at` int(11) NOT NULL, \n\
        PRIMARY KEY (`id`), \n\
        UNIQUE KEY `uidx_1` (`entity_id`,`entity_kind`) \n\
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;';

const downQuery = 'drop table if exists `reply_details`;';

const createTableReplyDetails = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery],
  dbKind: dbKind
};

module.exports = createTableReplyDetails;

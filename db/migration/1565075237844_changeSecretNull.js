const rootPrefix = '../..',
  database = require(rootPrefix + '/lib/globalConstant/database');

const dbName = database.twitterDbName;

const upQuery = 'ALTER TABLE `twitter_users_extended` MODIFY `secret` varchar(255) DEFAULT NULL;';

const downQuery = 'ALTER TABLE `twitter_users_extended` MODIFY `secret` varchar(255) NOT NULL;';

const changeSecretNull = {
  dbName: dbName,
  up: [upQuery],
  down: [downQuery]
};

module.exports = changeSecretNull;

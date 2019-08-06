const cassandra = require('cassandra-driver');

// https://docs.datastax.com/en/developer/nodejs-driver/4.1/features/logging/

// var a = require('./lib/cassandraWrapper');
// a.execute("Create keyspace pepo_api_development WITH replication ={'class': 'SimpleStrategy', 'replication_factor': '2'}",[]).then(console.log);

// a.execute('DROP TABLE pepo_api_development.user_notifications ',[], {}).then(console.log);

// a.execute('DROP TABLE pepo_api_development.user_notification_visit_details ',[], {}).then(console.log);

// kind -- videoTx, profileTx, fanUpdate

// s = "CREATE TABLE user_notifications \n\
// ( \n\
//   user_id bigint,\n\
//   last_action_timestamp timestamp,\n\
//   uuid uuid,\n\
//   kind smallint,\n\
//   landing_vars varchar,\n\
//   subject_user_id bigint,\n\
//   heading varchar,\n\
//   actor_ids SET<INT>,\n\
//   actor_count INT,\n\
// transaction_id varchar,\n\
// video_id bigint,\n\
//   PRIMARY KEY ((user_id), last_action_timestamp, uuid)\n\
// ) WITH CLUSTERING ORDER BY (last_action_timestamp DESC);"
//
// a.execute(s,[]).then(console.log);
//
// a.execute('DROP TABLE user_notification_center_visit_details ',[], {}).then(console.log);
//
//
// s = "CREATE TABLE user_notification_visit_details \n\
// ( \n\
//   user_id bigint,\n\
//   last_visited_at timestamp,\n\
//   unread_flag smallint(0/1),\n\
//   PRIMARY KEY ((user_id))\n\
// );"
//
// a.execute(s,[]).then(console.log);

// a.execute("insert into user_notifications(user_id, last_action_timestamp, uuid, kind, transaction_id, actor_ids) values (1,1, now() ,1, '1', {12,34})",[]).then(function(e){b=e; console.log(b)});

// a.execute('select * from user_notifications where user_id=1 and last_action_timestamp =1 and uuid = 7cedeff0-b4fb-11e9-880a-b13982bc7de2 and kind=1 allow filtering',[]).then(function(e){b=e; console.log(b)});

// a.execute('select * from user_notifications where user_id=3 order by last_action_timestamp  desc limit 2', []).then(function (e) {
//   b = e;
//   console.log(b)
// });

// b.rows[1].user_id.toString()
// b.rows[1].uuid.toString()
// Number(b.rows[0].last_action_timestamp)

//
// var queries = [
//   {
//     query: "insert into user_notifications(user_id, last_action_timestamp, uuid, kind, transaction_id, actor_ids) values (?,?, now() ,1, '1', {12,34})",
//     params: [ 3,3 ]
//   },
//   {
//     query: "insert into user_notifications(user_id, last_action_timestamp, uuid, kind, transaction_id, actor_ids) values (?,?, now() ,1, '1', {12,34})",
//     params: [ 3,4 ]
//   },
// ];
//
// a.batch(queries).then(function(e){b=e; console.log(b)});
//

const rootPrefix = '..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CassandraProvider = require(rootPrefix + '/lib/providers/cassandra'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for cassandra-driver wrapper
 *
 * @class CassandraSdkWrapper
 */
class CassandraSdkWrapper {
  /**
   * Initialize cassandra object.
   *
   * @sets oThis.client
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initializeCassandraObj() {
    const oThis = this;

    oThis.client = await CassandraProvider.getInstance();

    oThis._subscribeForLogging();
  }

  /**
   * Method to log cassandra logs.
   *
   * @private
   */
  _subscribeForLogging() {
    const oThis = this;

    oThis.client.on('log', function(level, className, message, furtherInfo) {
      const errMsg = `log event: ${level} -- ${message}`;

      switch (level) {
        case 'info': {
          // logger.log('l_cw_1', errMsg);
          break;
        }
        case 'warning': {
          logger.warn('l_cw_2', errMsg);
          break;
        }
        case 'error': {
          logger.error('l_cw_3', errMsg);
          const errorObject = responseHelper.error({
            internal_error_identifier: 'l_cw_3',
            api_error_identifier: 'something_went_wrong',
            debug_options: {
              message: message,
              className: className,
              furtherInfo: furtherInfo
            }
          });

          createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
          break;
        }
        default: {
          logger.log(`Current level: ${level}.`);
          break;
        }
      }
    });
  }

  /**
   * Method to run a single cassandra query.
   *
   * @param {string} query
   * @param {object} params
   * @param {object} [options]
   *
   * @returns {Promise<*>}
   */
  async execute(query, params, options = {}) {
    const oThis = this;

    if (!oThis.client) {
      await oThis._initializeCassandraObj();
    }

    return new Promise(function(resolve, reject) {
      oThis.client
        .execute(query, params, { prepare: true })
        .then((response) => resolve(response))
        .catch((err) => {
          logger.debug('Error in execute cassandra query: ', err);
          reject(err);
        });
    });
  }

  /**
   * Method to run batch multiple statements.
   *
   * @param {array<string>} queries
   * @param {object} params
   * @param {object} [options]
   *
   * @returns {Promise<*>}
   */
  async batch(queries, params, options = {}) {
    const oThis = this;

    if (!oThis.client) {
      await oThis._initializeCassandraObj();
    }

    return new Promise(function(resolve, reject) {
      oThis.client
        .batch(queries, { prepare: true })
        .then((response) => {
          return resolve(response);
        })
        .catch((err) => {
          logger.debug('Error in batch cassandra query: ', err);
          reject(err);
        });
    });
  }
}

module.exports = new CassandraSdkWrapper();

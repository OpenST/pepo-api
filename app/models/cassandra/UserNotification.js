const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/cassandra/Base'),
  cassandraWrapper = require(rootPrefix + '/lib/cassandraWrapper'),
  cassandraKeyspaceConstants = require(rootPrefix + '/lib/globalConstant/cassandraKeyspace');

// Declare variables.
const keyspace = cassandraKeyspaceConstants.cassandraKeyspaceName;

/**
 * Class for UserNotification model.
 *
 * @class UserNotificationModel
 */
class UserNotificationModel extends ModelBase {
  /**
   * Constructor for activity model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ keyspace: keyspace });

    const oThis = this;

    oThis.tableName = 'user_notifications';
    oThis.queryTableName = `${oThis.keyspace}.${oThis.tableName}`;
  }

  /**
   * Format db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.user_id
   * @param {number} dbRow.last_action_timestamp
   * @param {string} dbRow.uuid
   * @param {number} dbRow.kind
   * @param {string} dbRow.landing_vars
   * @param {number} dbRow.subject_user_id
   * @param {string} dbRow.heading
   * @param {number} dbRow.actor_ids
   * @param {number} dbRow.actor_count
   * @param {string} dbRow.transaction_id
   * @param {number} dbRow.video_id
   * @param {boolean} dbRow.thank_you_flag
   * @param {string} dbRow.thank_you_text
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      userId: dbRow.user_id.toString(10),
      lastActionTimestamp: dbRow.last_action_timestamp,
      uuid: dbRow.uuid,
      kind: dbRow.kind,
      landingVars: dbRow.landing_vars,
      subjectUserId: dbRow.subject_user_id,
      heading: dbRow.heading,
      actorIds: dbRow.actor_ids,
      actorCount: dbRow.actor_count,
      transactionId: dbRow.transaction_id,
      videoId: dbRow.video_id,
      thankYouFlag: dbRow.thank_you_flag,
      thankYouText: dbRow.thank_you_text
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * Insert entry in user_notifications table.
   *
   * @param {object} insertParameters
   *
   * @returns {Promise<void>}
   */
  async insert(insertParameters) {
    const oThis = this;

    const { queryString, valuesArray } = oThis.createInsertQueryString(insertParameters);

    await cassandraWrapper.execute(queryString, valuesArray);
  }

  /**
   * Create insert query and parameters for model.
   *
   * @param {object} insertParameters
   * @param {number/string} insertParameters.user_id
   * @param {string} insertParameters.last_action_timestamp
   * @param {number/string} insertParameters.kind
   * @param {number/string} insertParameters.subject_user_id
   * @param {number/string} insertParameters.actor_count
   * @param {number/string} insertParameters.heading_version
   * @param {number/string} insertParameters.flag_1
   * @param {number/string} insertParameters.flag_1
   * @param {string} insertParameters.uuid
   * @param {array<string/number>} insertParameters.actor_ids
   * @param {array<string/number>} insertParameters.actor_ids
   * @param {object} insertParameters.payload
   * @param {object} insertParameters.column_1
   * @param {object} insertParameters.column_2
   *
   * @returns {{valuesArray: [], queryString: {string}}}
   */
  createInsertQueryString(insertParameters) {
    const oThis = this;
    let queryString = `insert into ${oThis.queryTableName} (`,
      valueString = 'values (';

    const valuesArray = [];
    let isFirstParameter = true;

    for (const key in insertParameters) {
      if (isFirstParameter) {
        isFirstParameter = false;
      } else {
        queryString += ', ';
        valueString += ', ';
      }

      switch (key) {
        case 'user_id':
        case 'last_action_timestamp':
        case 'kind':
        case 'subject_user_id':
        case 'actor_count':
        case 'heading_version':
        case 'flag_1':
        case 'flag_2':
          valuesArray.push(Number(insertParameters[key]));
          break;
        case 'uuid': {
          valuesArray.push(insertParameters[key]);
          break;
        }
        case 'actor_ids': {
          valuesArray.push(new Set(insertParameters[key]));
          break;
        }
        case 'payload':
        case 'column_1':
        case 'column_2':
          valuesArray.push(JSON.stringify(insertParameters[key]));
          break;
        default: {
          throw new Error('Invalid key name.');
        }
      }
      queryString += key;
      valueString += '?';
    }
    valueString += ')';
    queryString += `) ${valueString}`;

    return { queryString, valuesArray };
  }

  /**
   * Flush cache.
   *
   * @param {object} params
   * @param {number} params.userId
   *
   * @returns {Promise<*>}
   */
  static async flushCache(params) {}
}

module.exports = UserNotificationModel;

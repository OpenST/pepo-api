const rootPrefix = '../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

// Declare variables.
const dbName = databaseConstants.bigDbName;

/**
 * Class for cron process model.
 *
 * @class CronProcessesModel
 */
class CronProcessesModel extends ModelBase {
  /**
   * Constructor for cron process model.
   *
   * @augments ModelBase
   *
   * @constructor
   */
  constructor() {
    super({ dbName: dbName });

    const oThis = this;

    oThis.tableName = 'cron_processes';
  }

  /**
   * This method gets the response for the id passed.
   *
   * @param {number} id
   *
   * @returns {Promise<>}
   */
  async get(id) {
    const oThis = this;

    return oThis
      .select(['kind', 'ip_address', 'group_id', 'params', 'status', 'last_started_at', 'last_ended_at'])
      .where({ id: id })
      .fire();
  }

  /**
   * This method inserts an entry in the table.
   *
   * @param {object} params
   * @param {string} params.kind
   * @param {string} params.ip_address
   * @param {number} params.chain_id
   * @param {string} params.params
   * @param {string} params.status
   * @param {number} params.lastStartTime
   * @param {number} params.lastEndTime
   *
   * @returns {Promise<*>}
   */
  async insertRecord(params) {
    const oThis = this;

    // Perform validations.
    if (
      !params.hasOwnProperty('kind') ||
      !params.hasOwnProperty('ip_address') ||
      !params.hasOwnProperty('status') ||
      !params.hasOwnProperty('chain_id')
    ) {
      throw new Error('Mandatory parameters are missing.');
    }

    if (typeof params.kind !== 'string' || typeof params.ip_address !== 'string' || typeof params.status !== 'string') {
      throw TypeError('Insertion parameters are of wrong params types.');
    }
    params.status = cronProcessesConstants.invertedStatuses[params.status];
    params.kind = cronProcessesConstants.invertedKinds[params.kind];

    return oThis.insert(params).fire();
  }

  /**
   * This method updates the last start time and status of an entry.
   *
   * @param {object} params
   * @param {number} params.id
   * @param {string} params.kind
   * @param {string} params.newLastStartTime
   * @param {string} params.newStatus
   *
   * @returns {Promise<*>}
   */
  async updateLastStartTimeAndStatus(params) {
    const oThis = this;

    // Perform validations.
    if (
      !params.hasOwnProperty('id') ||
      !params.hasOwnProperty('newLastStartTime') ||
      !params.hasOwnProperty('newStatus') ||
      !params.hasOwnProperty('kind')
    ) {
      throw new Error(
        'Mandatory parameters are missing. Expected an object with the following keys: {id, kind, newLastStartTime, newStatus}'
      );
    }

    params.newStatus = cronProcessesConstants.invertedStatuses[params.newStatus];
    params.kind = cronProcessesConstants.invertedKinds[params.kind];

    return oThis
      .update({
        last_started_at: params.newLastStartTime,
        status: params.newStatus,
        ip_address: coreConstants.IP_ADDRESS
      })
      .where({ id: params.id })
      .fire();
  }

  /**
   * This method updates the last end time and status of an entry.
   *
   * @param {object} params
   * @param {number} params.id
   * @param {number} params.newLastEndTime
   * @param {string} params.newStatus
   *
   * @returns {Promise<*>}
   */
  async updateLastEndTimeAndStatus(params) {
    const oThis = this;

    // Perform validations.
    if (!params.id || !params.newLastEndTime || !params.newStatus) {
      throw new Error(
        'Mandatory parameters are missing. Expected an object with the following keys: {id, newLastEndTime, newStatus}'
      );
    }
    params.newStatus = cronProcessesConstants.invertedStatuses[params.newStatus];

    await oThis
      .update({ last_ended_at: params.newLastEndTime, status: params.newStatus })
      .where({ id: params.id })
      .fire();
  }
}

module.exports = CronProcessesModel;

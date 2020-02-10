const rootPrefix = '../../../..',
  ModelBase = require(rootPrefix + '/app/models/mysql/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  databaseConstants = require(rootPrefix + '/lib/globalConstant/database'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses');

// Declare variables.
const dbName = databaseConstants.bigDbName;

const has = Object.prototype.hasOwnProperty; // Cache the lookup once, in module scope.

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
   * Format Db data.
   *
   * @param {object} dbRow
   * @param {number} dbRow.id
   * @param {number} dbRow.entity_kind
   * @param {string} dbRow.entity_id
   * @param {string} dbRow.extra_data
   * @param {number} dbRow.created_at
   * @param {number} dbRow.updated_at
   *
   * @return {object}
   */
  formatDbData(dbRow) {
    const oThis = this;

    const formattedData = {
      id: dbRow.id,
      kind: cronProcessesConstants.kinds[dbRow.kind],
      ipAddress: dbRow.ip_address,
      params: JSON.parse(dbRow.params),
      status: cronProcessesConstants.statuses[dbRow.status]
    };

    return oThis.sanitizeFormattedData(formattedData);
  }

  /**
   * This method gets the response for the id passed.
   *
   * @param {number} id
   *
   * @returns {Promise<>}
   */
  async getById(id) {
    const oThis = this;

    const response = await oThis
      .select(['id', 'kind', 'kind_name', 'ip_address', 'params', 'status', 'last_started_at', 'last_ended_at'])
      .where({ id: id })
      .fire();

    return response;
  }

  /**
   * This method gets the response for the array of ids passed.
   *
   * @param {array} ids
   *
   * @returns {Promise<>}
   */
  async getByIds(ids) {
    const oThis = this;

    const response = {};

    const dbRows = await oThis
      .select('*')
      .where({ id: ids })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const formatDbRow = oThis.formatDbData(dbRows[index]);
      response[formatDbRow.id] = formatDbRow;
    }

    return response;
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
      !has.call(params, 'kind') ||
      !has.call(params, 'ip_address') ||
      !has.call(params, 'status') ||
      !has.call(params, 'chain_id')
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
      !has.call(params, 'id') ||
      !has.call(params, 'newLastStartTime') ||
      !has.call(params, 'newStatus') ||
      !has.call(params, 'kind')
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

  /**
   * Get inverted value for status
   */
  get invertedStatuses() {
    return cronProcessesConstants.invertedStatuses;
  }
}

module.exports = CronProcessesModel;

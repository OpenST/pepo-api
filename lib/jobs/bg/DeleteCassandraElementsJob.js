const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class to delete elements from Cassandra in background.
 *
 * @class DeleteCassandraElementsJob
 */
class DeleteCassandraElementsJob {
  /**
   * Constructor for delete elements from Cassandra job.
   *
   * @param {object} params
   * @param {string} params.tableName
   * @param {Array} params.elementsToDelete eg: [{user_id: 1000}]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.tableName = params.tableName;
    oThis.elementsToDelete = params.elementsToDelete || [];

    oThis.modelObj = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    const promisesArray = [];

    await oThis._validateAndSanitize();

    await oThis._deleteElements();
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    if (!CommonValidators.validateString(oThis.tableName)) {
      return Promise.reject('Invalid tableName');
    }

    if (!CommonValidators.validateArray(oThis.elementsToDelete)) {
      return Promise.reject('Invalid elementsToDelete');
    }

    const ModelKlass = oThis._modelClass();
    oThis.modelObj = new ModelKlass();

    const partitionKeys = oThis.modelObj.keyObject().partition;
    for (let i = 0; i < oThis.elementsToDelete.length; i++) {
      const rowObj = oThis.elementsToDelete[i];
      if (!partitionKeys[0] || !rowObj[partitionKeys[0]]) {
        return Promise.reject('Partition key not present, element cannot be deleted.');
      }
    }
  }

  /**
   * Define model klass for cassandra tables
   *
   * @returns {any}
   * @private
   */
  _modelClass() {
    const oThis = this;

    switch (oThis.tableName) {
      case 'user_notifications':
        return require(rootPrefix + '/app/models/cassandra/UserNotification');

      case 'user_notification_visit_details':
        return require(rootPrefix + '/app/models/cassandra/UserNotificationVisitDetail');

      default:
        throw new Error('Unknown table name.');
    }
  }

  /**
   * Delete elements from Cassandra table
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteElements() {
    const oThis = this,
      tablePartitionKeys = oThis.modelObj.keyObject().partition;

    let promises = [];
    for (let row in oThis.elementsToDelete) {
      let queryString = 'DELETE FROM ' + oThis.tableName + ' WHERE ',
        valuesArray = [];
      for (let i = 0; i < tablePartitionKeys.length; i++) {
        const key = tablePartitionKeys[i];
        if (i === 0) {
          queryString += key + ' = ?';
          valuesArray.push(row[key]);
        } else if (row[key]) {
          queryString += ' AND ' + key + ' = ?';
          valuesArray.push(row[key]);
        }
      }
      console.log('Executing query: ', queryString, valuesArray);
      promises.push(oThis.modelObj.fire(queryString, valuesArray));
    }

    await Promise.all(promises);
  }
}

module.exports = DeleteCassandraElementsJob;

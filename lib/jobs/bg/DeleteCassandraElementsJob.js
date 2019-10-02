const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

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
   * @param {array} params.elementsToDelete eg: [{user_id: 1000}]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.tableName = params.tableName;
    oThis.elementsToDelete = params.elementsToDelete;

    oThis.ModelKlass = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    await oThis._deleteElements();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.ModelKlass
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    console.log('==oThis.tableName==========', oThis.tableName);
    console.log('==oThis.elementsToDelete==========', oThis.elementsToDelete);

    if (!CommonValidators.validateString(oThis.tableName)) {
      return Promise.reject(new Error('Invalid tableName'));
    }

    if (!CommonValidators.validateArray(oThis.elementsToDelete) || oThis.elementsToDelete.length <= 0) {
      return Promise.reject(new Error('Invalid elementsToDelete'));
    }

    oThis.ModelKlass = oThis._modelClass();

    const partitionKeys = new oThis.ModelKlass().keyObject().partition;
    for (let index = 0; index < oThis.elementsToDelete.length; index++) {
      const rowObj = oThis.elementsToDelete[index];
      if (!partitionKeys[0] || !rowObj[partitionKeys[0]]) {
        return Promise.reject(new Error('Partition key not present, element cannot be deleted.'));
      }
    }
  }

  /**
   * Define model klass for cassandra tables.
   *
   * @returns {any}
   * @private
   */
  _modelClass() {
    const oThis = this;

    switch (oThis.tableName) {
      case 'user_notifications': {
        return require(rootPrefix + '/app/models/cassandra/UserNotification');
      }

      case 'user_notification_visit_details': {
        return require(rootPrefix + '/app/models/cassandra/UserNotificationVisitDetail');
      }

      default:
        throw new Error('Unknown table name.');
    }
  }

  /**
   * Delete elements from cassandra table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _deleteElements() {
    const oThis = this;

    const modelObj = new oThis.ModelKlass(),
      tablePartitionKeys = modelObj.keyObject().partition,
      longToShortNamesMap = modelObj.longToShortNamesMap;

    const promises = [];
    const elementsToDeleteLength = oThis.elementsToDelete.length;

    for (let index = 0; index < elementsToDeleteLength; index++) {
      const row = oThis.elementsToDelete[index];
      const valuesArray = [];
      let queryString = 'DELETE FROM ' + modelObj.queryTableName + ' WHERE ';

      for (let ind = 0; ind < tablePartitionKeys.length; ind++) {
        const key = tablePartitionKeys[ind];
        if (ind === 0) {
          queryString += longToShortNamesMap[key] + ' = ?';
          valuesArray.push(row[key]);
        } else if (row[key]) {
          queryString += ' AND ' + longToShortNamesMap[key] + ' = ?';
          valuesArray.push(row[key]);
        }
      }

      console.log('==queryString======', queryString);
      console.log('==queryString======', valuesArray);

      logger.log('Executing query: ', queryString, valuesArray);
      promises.push(modelObj.fire(queryString, valuesArray));
      promises.push(oThis.ModelKlass.flushCache(row));
    }

    await Promise.all(promises);
  }
}

module.exports = DeleteCassandraElementsJob;

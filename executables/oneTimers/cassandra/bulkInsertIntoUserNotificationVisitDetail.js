const rootPrefix = '../../..',
  cassandraClient = require(rootPrefix + '/lib/cassandraWrapper'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class bulkInsertIntoUserNotificationVisitDetail {
  constructor() {}

  async perform() {
    const oThis = this;
    let inputParams = [];
    let query =
      'insert into pepo_api_development.user_notification_visit_details(user_id,last_visited_at) values (?,?);';
    const timestamp = Date.now();
    for (let index = 1; index <= 100; index++) {
      let params = [index, timestamp];
      inputParams.push(params);
    }
    await oThis.bulkInsert(query, inputParams);
    await cassandraClient.execute('select * from pepo_api_development.user_notification_visit_details limit 200');
  }

  /**
   * Bulk insert query
   *
   * @param query
   * @param inputParams
   * @returns {Promise<void>}
   */
  async bulkInsert(query, inputParams) {
    const batchSize = 25,
      promisesArray = [];

    while (inputParams.length) {
      const toBeProcessedParams = inputParams.splice(0, batchSize);
      const queries = [];

      for (let index = 0; index < toBeProcessedParams.length; index++) {
        const queryObj = {
          query: query,
          params: toBeProcessedParams[index]
        };
        queries.push(queryObj);
      }

      promisesArray.push(cassandraClient.batch(queries));
    }

    await Promise.all(promisesArray);
  }
}

const bulkInsert = new bulkInsertIntoUserNotificationVisitDetail();

bulkInsert
  .perform()
  .then(function(data) {
    logger.log('\nSuccess data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('\nError data: ', err);
    process.exit(1);
  });

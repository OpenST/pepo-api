const rootPrefix = '../..',
  UserNotificationVisitDetailModel = require(rootPrefix + '/app/models/cassandra/UserNotificationVisitDetail'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class BackPopulateUserNotificationVisitDetail {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    oThis.tableName = new UserNotificationVisitDetailModel().queryTableName;
    oThis.pageState = null;
    oThis.limit = 100;
    await oThis.populate();
  }

  async populate() {
    const oThis = this;
    let i = 0;

    const query = `select * from ${oThis.tableName};`;

    while (true) {
      i++;
      logger.log('populate======Iteration====oThis.pageState====', i, oThis.pageState);

      if (!oThis.pageState && i > 1) {
        return;
      }

      const updateParams = [];

      const options = {
        prepare: true,
        fetchSize: oThis.limit,
        pageState: oThis.pageState
      };

      const queryRsp = await new UserNotificationVisitDetailModel().eachRow(query, [], options, null, null);

      if (queryRsp.rows.length == 0) {
        return;
      }

      oThis.pageState = queryRsp.pageState;

      for (let i = 0; i < queryRsp.rows.length; i++) {
        let row = queryRsp.rows[i];
        let formattedRow = new UserNotificationVisitDetailModel().formatDbData(row);
        updateParams.push([formattedRow.activityLastVisitedAt || 0, formattedRow.userId]);
      }

      await oThis.updateRows(updateParams);
    }
  }

  async updateRows(updateParams) {
    const oThis = this,
      queries = [];

    const query = `UPDATE ${oThis.tableName} SET latest_seen_feed_time=? WHERE user_id=?`;

    for (let i = 0; i < updateParams.length; i++) {
      const updateParam = updateParams[i];
      queries.push({ query: query, params: updateParam });
    }

    await new UserNotificationVisitDetailModel().batchFire(queries);
  }
}

new BackPopulateUserNotificationVisitDetail()
  .perform()
  .then(function() {
    logger.win('All UserNotification latest_seen_feed_time Column back-populated successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error in back-populating. Error: ', err);
    process.exit(1);
  });

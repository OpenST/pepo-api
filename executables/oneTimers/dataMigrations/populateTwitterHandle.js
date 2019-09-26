/**
 * This script is used to populate twitter handle.
 *
 * Usage: node ./executables/oneTimers/dataMigrations/populateTwitterHandle.js
 *
 */
const rootPrefix = '../../..',
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  UsersWithoutOauthToken = require(rootPrefix + '/lib/twitter/oAuth1.0/UsersWithoutOauthToken'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const BATCH_SIZE = 100;

class PopulateTwitterHandle {
  constructor() {}

  /**
   * Async performer.
   *
   * @returns {Promise<boolean>}
   */
  async perform() {
    const oThis = this;

    let offset = 0;

    while (true) {
      logger.info('===============BATCH============');
      const twitterIds = await oThis._getTwitterIds(BATCH_SIZE, offset);

      // No more records present to migrate
      if (oThis.totalRows === 0) {
        break;
      }

      logger.log('twitterIds ======', twitterIds);

      await oThis._getTwitterHandle(twitterIds);

      offset = offset + BATCH_SIZE - twitterIds.length;
    }
  }

  /**
   * Get twitter Ids whose handle is Null.
   *
   * @returns {Promise<Array>}
   * @private
   */
  async _getTwitterIds(limit, offset) {
    const oThis = this,
      twitterIds = [];

    const dbRows = await new TwitterUserModel()
      .select('id, twitter_id, handle')
      .where(['handle IS NULL'])
      .limit(limit)
      .offset(offset)
      .order_by('id asc')
      .fire();

    oThis.totalRows = dbRows.length;

    for (let index = 0; index < dbRows.length; index++) {
      let dbRow = new TwitterUserModel().formatDbData(dbRows[index]);

      if (dbRow.id !== dbRow.twitterId) {
        twitterIds.push(dbRow.twitterId.toString());
      }
    }

    return twitterIds;
  }

  /**
   * Get twitter handle.
   *
   * @param twitterIds
   * @returns {Promise<never>}
   * @private
   */
  async _getTwitterHandle(twitterIds) {
    if (twitterIds.length === 0) {
      return;
    }

    const twitterResponse = await new UsersWithoutOauthToken().lookup({ twitterIds: twitterIds });

    if (twitterResponse.isFailure()) {
      return Promise.reject(twitterResponse);
    }

    const twitterResponseData = twitterResponse.data.response;

    for (let index = 0; index < twitterIds.length; index++) {
      const twitterId = twitterIds[index],
        twitterData = twitterResponseData[twitterId];

      const twitterIdStr = twitterData.idStr,
        twitterHandle = twitterData.handle;

      await new TwitterUserModel()
        .update({
          handle: twitterHandle
        })
        .where({
          twitter_id: twitterIdStr
        })
        .fire();
    }

    // Flush cache.
  }
}

const populateTwitterHandle = new PopulateTwitterHandle();

populateTwitterHandle
  .perform()
  .then(function(data) {
    logger.log('\nSuccess data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('\nError data: ', err);
    process.exit(1);
  });

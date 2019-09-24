const rootPrefix = '../../..',
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  UsersWithoutOauthToken = require(rootPrefix + '/lib/twitter/oAuth1.0/UsersWithoutOauthToken'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const BATCH_SIZE = 5;

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
      const twitterIds = await oThis._getTwitterIds();

      if (twitterIds.length === 0) {
        break;
      }

      console.log('twitterIds ======', twitterIds);

      await oThis._getTwitterHandle(twitterIds);

      break;

      offset = offset + BATCH_SIZE;
    }
  }

  /**
   * Get twitter Ids whose handle is Null.
   *
   * @returns {Promise<Array>}
   * @private
   */
  async _getTwitterIds() {
    const twitterIds = [];

    const dbRows = await new TwitterUserModel()
      .select('id, twitter_id, handle')
      .where(['handle IS NULL'])
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      let dbRow = new TwitterUserModel().formatDbData(dbRows[index]);

      if (dbRow.id !== dbRow.twitterId) {
        twitterIds.push(dbRow.twitterId.toString());
      }
    }

    return twitterIds;
  }

  async _getTwitterHandle(twitterIds) {
    const twitterResponse = await new UsersWithoutOauthToken().lookup({ twitterIds: twitterIds });

    console.log('twitterResponse ======', twitterResponse);

    if (twitterResponse.isFailure()) {
      return Promise.reject(twitterResponse);
    }

    const twitterResponseData = twitterResponse.data.response;

    for (let index = 0; index < twitterIds.length; index++) {
      const twitterId = twitterIds[index],
        twitterData = twitterResponseData[twitterId];

      // let a = new UserTwitterEntityClass(twitterData);
      //
      // console.log('a ======', a, '======', a.handle);

      const twitterIdStr = twitterData.userData.id_str,
        twitterHandle = twitterData.userData.screen_name;

      console.log('twitterIdStr ======', twitterIdStr);
      console.log('twitterHandle ======', twitterHandle);

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

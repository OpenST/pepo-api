const rootPrefix = '../..',
  FriendsTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Friends'),
  UsersTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Users'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Twitter Friends Sync.
 *
 * @class TwitterFriendSync
 */
class TwitterFriendSync {
  /**
   * Constructor for TwitterFriendSync service.
   *
   * @param {object} params
   * @param {string} params.twitterUserId: User Id to sync
   * @param {string} params.cursor: cursor to start from
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.twitterUserId = params.twitterUserId;
    oThis.startCursor = params.cursor || null;

    oThis.currentCursor = null;

    oThis.parallelThreads = 3;
    oThis.querySize = 3;

    oThis.getFriendsIdsData = {};
    oThis.getFriendIdsIterationCount = 1;
    oThis.nonExistingTwitterIds = [];
    oThis.twitterUserData = {};
  }

  /**
   * Perform: Perform Twitter Friend Sync.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;
    await oThis._start().catch(function(e) {
      logger.error('Exception in Perform for Twitter User List Sunc', e);
      oThis._reEnqueue();
    });

    return oThis.twitterUserData;
  }

  async _start() {
    const oThis = this;

    let currentIterator = oThis.getFriendIdsIterationCount;
    logger.log(`start: START(${currentIterator})`);

    if (currentIterator > 1) {
      oThis.currentCursor = oThis.getFriendsIdsData[currentIterator - 1].next_cursor_str;

      if (!oThis.currentCursor || oThis.currentCursor == '' || oThis.currentCursor == '0') {
        return;
      }
    } else {
      oThis.currentCursor = oThis.startCursor;
    }

    let reqParams = {
      twitterId: oThis.twitterUserId,
      cursor: oThis.currentCursor
    };

    let resp = await new FriendsTwitterRequestClass().getIds(reqParams);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.getFriendsIdsData[currentIterator] = resp.data;

    oThis.getFriendIdsIterationCount = currentIterator + 1;

    let fetchTwitterUserResp = await oThis._populateTwitterUserData(currentIterator);

    logger.log(`end: START(${currentIterator})`);

    await oThis._start();
  }

  async _populateTwitterUserData(currentIterator) {
    const oThis = this,
      memcacheThreads = oThis.parallelThreads,
      memcacheFetchSize = oThis.querySize;

    logger.log(`start: populateTwitterUserData(${currentIterator})`);

    let twitterFriendIds = oThis.getFriendsIdsData[currentIterator].ids;
    let maxIteratorCount = Math.ceil(twitterFriendIds.length / (memcacheFetchSize * memcacheThreads));

    let startIndex = 0;

    for (let i = 0; i < maxIteratorCount; i++) {
      let promises = [];

      for (let j = 0; j < memcacheThreads; j++) {
        let twitterIds = twitterFriendIds.slice(startIndex, startIndex + memcacheFetchSize);

        if (startIndex >= twitterFriendIds.length) {
          break;
        }

        let promise = oThis._getFromMemcache(twitterIds).then(function(ids) {
          if (ids.length > 0) {
            oThis.nonExistingTwitterIds = oThis.nonExistingTwitterIds.concat(ids);
          }
        });

        promises.push(promise);
        startIndex = startIndex + memcacheFetchSize;
      }

      await Promise.all(promises);
    }

    await oThis._fetchUserFromTwitter();
    logger.log(`end: populateTwitterUserData(${currentIterator})`);
  }

  async _getFromMemcache(twitterIds) {
    const oThis = this;
    logger.log('start: getFromMemcache()');

    const twitterUserObjCacheResp = await new TwitterUserByTwitterIdsCache({ twitterIds: twitterIds }).fetch();

    const currentNonExistingTwitterIds = [];

    if (twitterUserObjCacheResp.isFailure()) {
      return Promise.reject(twitterUserObjCacheResp);
    }

    for (let i = 0; i < twitterIds.length; i++) {
      let twitterId = twitterIds[i];
      let twitterUserObj = twitterUserObjCacheResp.data[twitterId];
      if (twitterUserObj.id) {
        oThis.twitterUserData[twitterId] = twitterUserObj;
      } else {
        currentNonExistingTwitterIds.push(twitterId);
      }
    }

    logger.log('end: getFromMemcache()');

    return currentNonExistingTwitterIds;
  }

  async _fetchUserFromTwitter() {
    const oThis = this,
      parallelThreads = oThis.parallelThreads,
      twitterLookupSize = oThis.querySize;

    logger.log('start: fetchUserFromTwitter()');

    const nonExistingTwitterIdsSet = [...new Set(oThis.nonExistingTwitterIds)]; // Removes duplication.

    let maxIteratorCount = Math.ceil(nonExistingTwitterIdsSet.length / (twitterLookupSize * parallelThreads));

    let startIndex = 0;
    for (let j = 0; j < maxIteratorCount; j++) {
      let promises = [];

      for (let i = 0; i < parallelThreads; i++) {
        if (startIndex >= nonExistingTwitterIdsSet.length) {
          break;
        }

        const twitterIdsToLookup = nonExistingTwitterIdsSet.slice(startIndex, startIndex + twitterLookupSize);

        let promise = new UsersTwitterRequestClass()
          .lookup({ twitterIds: twitterIdsToLookup })
          .then(async function(userLookupResp) {
            return oThis._processTwitterUserLookupData(twitterIdsToLookup, userLookupResp);
          });

        promises.push(promise);

        startIndex = startIndex + twitterLookupSize;
      }

      await Promise.all(promises);
    }

    logger.log('end: fetchUserFromTwitter()');
  }

  async _processTwitterUserLookupData(twitterIdsToLookup, userLookupResp) {
    const oThis = this;

    let bulkInsertVal = [];
    for (let i = 0; i < twitterIdsToLookup.length; i++) {
      let twitterId = twitterIdsToLookup[i];

      let twitterUserEntity = userLookupResp.data[twitterId];

      if (twitterUserEntity.idStr) {
        let val = [
          twitterUserEntity.idStr,
          twitterUserEntity.email,
          twitterUserEntity.formattedName,
          twitterUserEntity.nonDefaultprofileImageUrl
        ];

        bulkInsertVal.push(val);
      } else {
        throw `Invalid Resp for Twitter ID=> ${twitterId}`;
      }
    }

    let r = await new TwitterUserModel()
      .insertMultiple(['twitter_id', 'email', 'name', 'profile_image_url'], bulkInsertVal)
      .fire();

    await new TwitterUserByTwitterIdsCache({
      twitterIds: twitterIdsToLookup
    }).clear();

    await oThis._getFromMemcache(twitterIdsToLookup);
  }

  async _reEnqueue() {
    const oThis = this;
    let params = {
      twitterUserId: oThis.twitterUserId,
      cursor: oThis.currentCursor
    };

    logger.log('_reEnqueue=>', params);
  }
}

module.exports = TwitterFriendSync;

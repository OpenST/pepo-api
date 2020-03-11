const rootPrefix = '../../..',
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  UsersTwitterRequestClass = require(rootPrefix + '/lib/connect/wrappers/twitter/oAuth1.0/Users'),
  FriendsTwitterRequestClass = require(rootPrefix + '/lib/connect/wrappers/twitter/oAuth1.0/Friends'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  UserContributorByUIdsAndCBUIdCache = require(rootPrefix +
    '/lib/cacheManagement/multi/UserContributorByUserIdsAndContributedByUserId'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  TwitterUserConnectionByTwitterUser2Ids = require(rootPrefix +
    '/lib/cacheManagement/multi/TwitterUserConnectionByTwitterUser2Ids'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  sigIntConstant = require(rootPrefix + '/lib/globalConstant/sigInt'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  twitterUserConnectionConstants = require(rootPrefix + '/lib/globalConstant/twitterUserConnection');

/**
 * Class for twitter friends sync start.
 *
 * @class TwitterFriendSyncStart
 */
class TwitterFriendSyncStart {
  /**
   * Constructor for twitter friends sync start.
   *
   * @param {object} params
   * @param {string} params.twitterId: User Id to sync
   * @param {string} params.cursor: cursor to start from
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.twitterId = params.twitterId;
    oThis.startCursor = params.cursor || null;

    oThis.currentTwitterUserObj = null;
    oThis.oAuthToken = null;
    oThis.oAuthTokenSecret = null;

    oThis.currentCursor = null;

    oThis.parallelThreads = 5;
    oThis.dbLimitSize = 100;

    oThis.nextCursorStr = {};
    oThis.getFriendIdsIterationCount = 1;

    oThis.twitterUser2Ids = [];
  }

  /**
   * Perform: Perform Twitter Friend Sync.
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._getTwitterUserData();

    await oThis._start().catch(function(error) {
      logger.error('Exception in Perform for Twitter User List Sync', error);

      if (responseHelper.isCustomResult(error) && error.apiErrorIdentifier === 'twitter_rate_limit') {
        let headers = error.debugOptions.headers;
        oThis._reEnqueue(headers['x-rate-limit-reset']);
      } else {
        Promise.reject(error);
      }
    });
  }

  /**
   * Get Twitter User: Get UserId, and twitterUserId for the current User.
   *
   * @return {Promise<void>}
   */
  async _getTwitterUserData() {
    const oThis = this;
    logger.log(`start: _getTwitterUserData`);

    let id = oThis.twitterId;

    const twitterUserObjCacheResp = await new TwitterUserByTwitterIdsCache({ twitterIds: [id] }).fetch();

    if (twitterUserObjCacheResp.isFailure()) {
      return Promise.reject(twitterUserObjCacheResp);
    }

    if (twitterUserObjCacheResp.data[id].userId) {
      oThis.currentTwitterUserObj = twitterUserObjCacheResp.data[id];
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_tfs_s_sctu_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: { twitterId: id }
        })
      );
    }

    const SecureTwitterUserExtendedRes = await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserId: oThis.currentTwitterUserObj.id
    }).fetch();

    if (SecureTwitterUserExtendedRes.isFailure()) {
      return Promise.reject(SecureTwitterUserExtendedRes);
    }

    let twitterUserExtendedObj = SecureTwitterUserExtendedRes.data;

    // oAuthTokenSecret is not retrievable for expired twitterUserExtendedObj.
    if (twitterUserExtendedObj.status === twitterUserExtendedConstants.activeStatus) {
      oThis.oAuthToken = twitterUserExtendedObj.token;
      oThis.oAuthTokenSecret = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, twitterUserExtendedObj.secretLc);
    }

    logger.log(`end: _getTwitterUserData`);
  }

  /**
   * Recursive Function to get following list of twitter user
   *
   * @return {Promise<void>}
   */
  async _start() {
    const oThis = this;

    if (!oThis.oAuthTokenSecret) {
      return;
    }

    if (sigIntConstant.getSigIntStatus != 0) {
      oThis._reEnqueue();
      return;
    }

    let currentIterator = oThis.getFriendIdsIterationCount;
    logger.log(`start: START(${currentIterator})`);

    if (currentIterator > 1) {
      if (!oThis.nextCursorStr || oThis.nextCursorStr == '' || oThis.nextCursorStr == '0') {
        return;
      }
      oThis.currentCursor = oThis.nextCursorStr;
    } else {
      oThis.currentCursor = oThis.startCursor;
    }

    let reqParams = {
      twitterId: oThis.twitterId,
      cursor: oThis.currentCursor,
      oAuthToken: oThis.oAuthToken,
      oAuthTokenSecret: oThis.oAuthTokenSecret
    };

    let resp = await new FriendsTwitterRequestClass().getIds(reqParams);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.nextCursorStr = resp.data.response.next_cursor_str;

    let twitterUserMapByTwitterId = await oThis._getTwitterUserMap(currentIterator, resp.data.response.ids);

    await oThis._populateTwitterUserConnection(twitterUserMapByTwitterId);

    oThis.getFriendIdsIterationCount = currentIterator + 1;

    logger.log(`end: START(${currentIterator})`);

    await oThis._start();
  }

  /**
   * Get Twitter User Objects
   *
   * @return {Promise<twitterUserMapByTwitterId>}
   */
  async _getTwitterUserMap(currentIterator, twitterFriendIds) {
    const oThis = this,
      memcacheThreads = oThis.parallelThreads,
      memcacheFetchSize = oThis.dbLimitSize;

    logger.log(`start: populateTwitterUserData(${currentIterator})`);

    let maxIteratorCount = Math.ceil(twitterFriendIds.length / (memcacheFetchSize * memcacheThreads));

    let startIndex = 0;
    let nonExistingTwitterIds = [];
    let twitterUserData = {};

    for (let i = 0; i < maxIteratorCount; i++) {
      let promises = [];

      for (let j = 0; j < memcacheThreads; j++) {
        let twitterIds = twitterFriendIds.slice(startIndex, startIndex + memcacheFetchSize);

        if (startIndex >= twitterFriendIds.length) {
          break;
        }

        let promise = oThis._getTwitterUserFromMemcache(twitterIds).then(function(resp) {
          Object.assign(twitterUserData, resp.twitterUserData);

          if (resp.nonExistingTwitterIds.length > 0) {
            nonExistingTwitterIds = nonExistingTwitterIds.concat(resp.nonExistingTwitterIds);
          }
        });

        promises.push(promise);
        startIndex = startIndex + memcacheFetchSize;
      }

      await Promise.all(promises);
    }

    let twitterUserDataResp = await oThis._fetchAndInserInTwitterUser(nonExistingTwitterIds);
    Object.assign(twitterUserData, twitterUserDataResp);

    logger.log(`end: populateTwitterUserData(${currentIterator})`);
    return twitterUserData;
  }

  /**
   * Get Twitter User Obj from Memcache by TwitterIds and return a list of non existing twitter ids
   *
   * @return {Promise<MAP>}
   */
  async _getTwitterUserFromMemcache(twitterIds) {
    const oThis = this;
    logger.log('start: getFromMemcache()');

    const twitterUserObjCacheResp = await new TwitterUserByTwitterIdsCache({ twitterIds: twitterIds }).fetch();

    const nonExistingTwitterIds = [];
    const existingTwitterUserIds = [];

    if (twitterUserObjCacheResp.isFailure()) {
      return Promise.reject(twitterUserObjCacheResp);
    }

    let twitterUserData = {};

    for (let i = 0; i < twitterIds.length; i++) {
      let twitterId = twitterIds[i];
      let twitterUserObj = twitterUserObjCacheResp.data[twitterId];
      if (twitterUserObj.id) {
        existingTwitterUserIds.push(twitterUserObj.id);
        twitterUserData[twitterId] = twitterUserObj;
      } else {
        nonExistingTwitterIds.push(twitterId);
      }
    }

    logger.log('end: getFromMemcache()');

    return {
      twitterUserData: twitterUserData,
      existingTwitterUserIds: existingTwitterUserIds,
      nonExistingTwitterIds: nonExistingTwitterIds
    };
  }

  /**
   * Get User data from Twitter by TwitterIds and insert in TwitterUser Table
   *
   * @return {Promise<void>}
   */
  async _fetchAndInserInTwitterUser(nonExistingTwitterIds) {
    const oThis = this,
      parallelThreads = oThis.parallelThreads,
      twitterLookupSize = oThis.dbLimitSize;

    let twitterUserData = {};

    if (nonExistingTwitterIds.length < 1) {
      return twitterUserData;
    }

    logger.log('start: fetchUserFromTwitter()');

    const nonExistingTwitterIdsSet = [...new Set(nonExistingTwitterIds)]; // Removes duplication.

    let maxIteratorCount = Math.ceil(nonExistingTwitterIdsSet.length / (twitterLookupSize * parallelThreads));

    let startIndex = 0;
    for (let j = 0; j < maxIteratorCount; j++) {
      let promises = [];

      for (let i = 0; i < parallelThreads; i++) {
        if (startIndex >= nonExistingTwitterIdsSet.length) {
          break;
        }

        const twitterIdsToLookup = nonExistingTwitterIdsSet.slice(startIndex, startIndex + twitterLookupSize);

        let reqParams = {
          oAuthToken: oThis.oAuthToken,
          oAuthTokenSecret: oThis.oAuthTokenSecret,
          twitterIds: twitterIdsToLookup
        };

        let promise = new UsersTwitterRequestClass().lookup(reqParams).then(async function(userLookupResp) {
          if (userLookupResp.isFailure()) {
            return Promise.reject(userLookupResp);
          }

          let twitterUserDataResp = await oThis._bulkInsertInTwitterUser(twitterIdsToLookup, userLookupResp);
          Object.assign(twitterUserData, twitterUserDataResp);
        });

        promises.push(promise);

        startIndex = startIndex + twitterLookupSize;
      }

      await Promise.all(promises);
    }

    return twitterUserData;
    logger.log('end: fetchUserFromTwitter()');
  }

  /**
   * Bulk Insert in Twitter User Connection
   *
   * @return {Promise<void>}
   */
  async _populateTwitterUserConnection(twitterUserMapByTwitterId) {
    const oThis = this;
    logger.log(`start: _populateTwitterUserConnection()`);

    let bulkInsertVal = [];
    let registeredUserIdsMap = {};

    for (let twitterId in twitterUserMapByTwitterId) {
      let twitterUserObj = twitterUserMapByTwitterId[twitterId];

      if (!twitterUserObj.twitterId) {
        continue;
      }

      if (twitterUserObj.userId) {
        registeredUserIdsMap[twitterUserObj.userId] = twitterUserObj.id;
        continue;
      }

      let val = [oThis.currentTwitterUserObj.id, twitterUserObj.id, 0];
      oThis.twitterUser2Ids.push(twitterUserObj.id);

      bulkInsertVal.push(val);
    }

    if (bulkInsertVal.length > 0) {
      let maxIteratorCount = Math.ceil(bulkInsertVal.length / (oThis.dbLimitSize * oThis.parallelThreads));
      let startIndex = 0;

      for (let j = 0; j < maxIteratorCount; j++) {
        let promises = [];

        for (let i = 0; i < oThis.parallelThreads; i++) {
          if (startIndex >= bulkInsertVal.length) {
            break;
          }

          let insertData = bulkInsertVal.slice(startIndex, startIndex + oThis.dbLimitSize);

          let promise = new TwitterUserConnectionModel()
            .insertMultiple(['twitter_user1_id', 'twitter_user2_id', 'properties'], insertData, { withIgnore: true })
            .fire();

          promises.push(promise);
          startIndex = startIndex + oThis.dbLimitSize;
        }
        await Promise.all(promises);
      }
    }

    await oThis._populateRegisterTwitterUserConnection(registeredUserIdsMap);
    await oThis._clearTwitterUserConnectionCache();
    oThis.twitterUser2Ids = [];

    logger.log(`end: _populateTwitterUserConnection()`);
  }

  /**
   * Bulk Insert Registered Users in Twitter User Connection
   *
   * @return {Promise<void>}
   */
  async _populateRegisterTwitterUserConnection(registeredUserIdsMap) {
    const oThis = this;
    logger.log(`start: _populateRegisterTwitterUserConnection()`);

    if (Object.keys(registeredUserIdsMap).length < 1) {
      return;
    }

    let bulkInsertVal = [];

    let twitterUser2RegisteredVal = new TwitterUserConnectionModel().setBitwise(
      'properties',
      0,
      twitterUserConnectionConstants.isTwitterUser2RegisteredProperty
    );

    let contributedTopropertyVal = new TwitterUserConnectionModel().setBitwise(
      'properties',
      twitterUser2RegisteredVal,
      twitterUserConnectionConstants.isTwitterUser2ContributedToProperty
    );

    let registeredUserIds = Object.keys(registeredUserIdsMap);
    let maxIteratorCount = Math.ceil(registeredUserIds.length / (oThis.dbLimitSize * oThis.parallelThreads));
    let startIndex = 0;

    for (let j = 0; j < maxIteratorCount; j++) {
      let promises = [];

      for (let i = 0; i < oThis.parallelThreads; i++) {
        if (startIndex >= registeredUserIds.length) {
          break;
        }

        let userIds = registeredUserIds.slice(startIndex, startIndex + oThis.dbLimitSize);

        let promise = new UserContributorByUIdsAndCBUIdCache({
          userIds: userIds,
          contributedByUserId: oThis.currentTwitterUserObj.userId
        })
          .fetch()
          .then(async function(cacheResp) {
            if (cacheResp.isFailure()) {
              return Promise.reject(cacheResp);
            }
            let val = null;

            for (let contributedToId in cacheResp.data) {
              let userContributedByobj = cacheResp.data[contributedToId];
              let twitterUserId = registeredUserIdsMap[contributedToId];
              oThis.twitterUser2Ids.push(twitterUserId);

              if (userContributedByobj.id) {
                val = [oThis.currentTwitterUserObj.id, twitterUserId, contributedTopropertyVal];
              } else {
                val = [oThis.currentTwitterUserObj.id, twitterUserId, twitterUser2RegisteredVal];
              }

              bulkInsertVal.push(val);
            }

            await new TwitterUserConnectionModel()
              .insertMultiple(['twitter_user1_id', 'twitter_user2_id', 'properties'], bulkInsertVal)
              .onDuplicate({ properties: 'VALUES(properties)' })
              .fire();
          });

        promises.push(promise);
        startIndex = startIndex + oThis.dbLimitSize;
      }
      await Promise.all(promises);
    }
    logger.log(`end: _populateRegisterTwitterUserConnection()`);
  }

  /**
   * Bulk Insert in Twitter User Connection
   *
   * @return {Promise<void>}
   */
  async _bulkInsertInTwitterUser(twitterIdsToLookup, userLookupResp) {
    const oThis = this;
    logger.log('start: _bulkInsertInTwitterUser()');

    let bulkInsertVal = [];
    for (let i = 0; i < twitterIdsToLookup.length; i++) {
      let twitterId = twitterIdsToLookup[i];

      let twitterUserEntity = userLookupResp.data.response[twitterId];

      if (twitterUserEntity.idStr) {
        let val = [
          twitterUserEntity.idStr,
          twitterUserEntity.email,
          twitterUserEntity.handle,
          twitterUserEntity.formattedName,
          twitterUserEntity.nonDefaultProfileImageShortUrl
        ];

        bulkInsertVal.push(val);
      } else {
        throw `Invalid Resp for Twitter ID=> ${twitterId}`;
      }
    }

    if (bulkInsertVal.length < 1) {
      return {};
    }

    let r = await new TwitterUserModel()
      .insertMultiple(['twitter_id', 'email', 'handle', 'name', 'profile_image_url'], bulkInsertVal)
      .fire();

    await new TwitterUserByTwitterIdsCache({
      twitterIds: twitterIdsToLookup
    }).clear();

    let resp = await oThis._getTwitterUserFromMemcache(twitterIdsToLookup);

    await new TwitterUserByIdsCache({
      ids: resp.existingTwitterUserIds
    }).clear();

    logger.log('end: _bulkInsertInTwitterUser()');

    return resp.twitterUserData;
  }

  /**
   * ReEnqueue Task
   *
   * @return {Promise<void>}
   */
  async _reEnqueue(resetTime) {
    let options = {};

    const oThis = this;
    let messagePayload = {
      twitterId: oThis.twitterId,
      cursor: oThis.currentCursor,
      resetTime: resetTime
    };
    logger.log('start: twitterFriendsSyncJob _reEnqueue()', messagePayload);

    // Todo: use specific time for publishAfter if available.

    if (resetTime) {
      const publishAfter = resetTime * 1000 - Date.now();
      options = { publishAfter: publishAfter };
    }

    await bgJob.enqueue(bgJobConstants.twitterFriendsSyncJobTopic, messagePayload, options);
  }

  /**
   * Clear Cache on Twitter User Connection
   *
   * @return {Promise<void>}
   */
  async _clearTwitterUserConnectionCache() {
    const oThis = this;
    logger.log('start: _clearTwitterUserConnectionCache()');

    await TwitterUserConnectionModel.flushCache({ twitterUser1Id: oThis.currentTwitterUserObj.id });

    await new TwitterUserConnectionByTwitterUser2Ids({
      twitterUser1Id: oThis.currentTwitterUserObj.id,
      twitterUser2Ids: oThis.twitterUser2Ids
    }).clear();

    logger.log('end: _clearTwitterUserConnectionCache()');
  }
}

module.exports = TwitterFriendSyncStart;

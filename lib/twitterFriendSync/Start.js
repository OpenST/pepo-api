const rootPrefix = '../..',
  FriendsTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Friends'),
  UsersTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Users'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  twitterUserConnectionConstants = require(rootPrefix + '/lib/globalConstant/twitterUserConnection'),
  UserContributorByUIdsAndCBUIdCache = require(rootPrefix +
    '/lib/cacheManagement/multi/UserContributorByUserIdsAndContributedByUserId'),
  BgJob = require(rootPrefix + '/lib/BgJob'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
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

      if (responseHelper.isCustomResult(error) && error.internalErrorCode == 'twitterRateLimit') {
        let headers = error.debugOptions.headers;
        oThis._reEnqueue(headers['x-rate-limit-reset']);
      } else {
        Promise.reject(error);
      }
    });
  }

  async _getTwitterUserData() {
    const oThis = this;
    logger.log(`start: _getTwitterUserData`);

    let id = '819112169035988992' || oThis.twitterId;

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
      twitterUserid: oThis.currentTwitterUserObj.id
    }).fetch();

    if (SecureTwitterUserExtendedRes.isFailure()) {
      return Promise.reject(SecureTwitterUserExtendedRes);
    }

    let twitterUserExtendedObj = SecureTwitterUserExtendedRes.data;

    oThis.oAuthToken = twitterUserExtendedObj.token;
    oThis.oAuthTokenSecret = localCipher.decrypt(coreConstants.CACHE_SHA_KEY, twitterUserExtendedObj.secretLc);

    logger.log(`end: _getTwitterUserData`);
  }

  async _start() {
    const oThis = this;

    //Todo: sigint handle

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

    oThis.nextCursorStr = resp.data.next_cursor_str;

    let twitterUserMapByTwitterId = await oThis._populateTwitterUserData(currentIterator, resp.data.ids);

    await oThis._populateTwitterUserConnection(twitterUserMapByTwitterId);

    oThis.getFriendIdsIterationCount = currentIterator + 1;

    logger.log(`end: START(${currentIterator})`);

    await oThis._start();
  }

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
      await oThis._clearTwitterUserConnectionCache();
    }

    await oThis._populateRegisterTwitterUserConnection(registeredUserIdsMap);

    logger.log(`end: _populateTwitterUserConnection()`);
  }

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
    await oThis._clearTwitterUserConnectionCache();
    logger.log(`end: _populateRegisterTwitterUserConnection()`);
  }

  async _populateTwitterUserData(currentIterator, twitterFriendIds) {
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

        let promise = oThis._getFromMemcache(twitterIds).then(function(resp) {
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

    let twitterUserDataResp = await oThis._fetchUserFromTwitter(nonExistingTwitterIds);
    Object.assign(twitterUserData, twitterUserDataResp);

    logger.log(`end: populateTwitterUserData(${currentIterator})`);
    return twitterUserData;
  }

  async _getFromMemcache(twitterIds) {
    const oThis = this;
    logger.log('start: getFromMemcache()');

    const twitterUserObjCacheResp = await new TwitterUserByTwitterIdsCache({ twitterIds: twitterIds }).fetch();

    const nonExistingTwitterIds = [];

    if (twitterUserObjCacheResp.isFailure()) {
      return Promise.reject(twitterUserObjCacheResp);
    }

    let twitterUserData = {};

    for (let i = 0; i < twitterIds.length; i++) {
      let twitterId = twitterIds[i];
      let twitterUserObj = twitterUserObjCacheResp.data[twitterId];
      if (twitterUserObj.id) {
        twitterUserData[twitterId] = twitterUserObj;
      } else {
        nonExistingTwitterIds.push(twitterId);
      }
    }

    logger.log('end: getFromMemcache()');

    return { twitterUserData: twitterUserData, nonExistingTwitterIds: nonExistingTwitterIds };
  }

  async _fetchUserFromTwitter(nonExistingTwitterIds) {
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
          let twitterUserDataResp = await oThis._processTwitterUserLookupData(twitterIdsToLookup, userLookupResp);
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

  async _processTwitterUserLookupData(twitterIdsToLookup, userLookupResp) {
    const oThis = this;
    logger.log('start: _processTwitterUserLookupData()');

    let bulkInsertVal = [];
    for (let i = 0; i < twitterIdsToLookup.length; i++) {
      let twitterId = twitterIdsToLookup[i];

      let twitterUserEntity = userLookupResp.data[twitterId];

      if (twitterUserEntity.idStr) {
        let val = [
          twitterUserEntity.idStr,
          twitterUserEntity.email,
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
      .insertMultiple(['twitter_id', 'email', 'name', 'profile_image_url'], bulkInsertVal)
      .fire();

    await new TwitterUserByTwitterIdsCache({
      twitterIds: twitterIdsToLookup
    }).clear();

    let resp = await oThis._getFromMemcache(twitterIdsToLookup);

    logger.log('end: _processTwitterUserLookupData()');

    return resp.twitterUserData;
  }

  async _reEnqueue(resetTime) {
    const oThis = this;
    let messagePayload = {
      twitterId: oThis.twitterId,
      cursor: oThis.currentCursor,
      resetTime: resetTime
    };
    logger.log('start: twitterFriendsSyncJob _reEnqueue()', messagePayload);
    //todo: enqueue with timeout
    await BgJob.enqueue(bgJobConstants.twitterFriendsSyncJobTopic, messagePayload);
  }

  async _clearTwitterUserConnectionCache() {
    const oThis = this;
    logger.log('start: _clearTwitterUserConnectionCache()');

    logger.log('end: _clearTwitterUserConnectionCache()');
  }
}

module.exports = TwitterFriendSync;

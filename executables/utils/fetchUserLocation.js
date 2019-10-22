/**
 *
 * node executables/utils/fetchUserLocation.js --token '1152149157206847488-ocfNpLMSQMykW21zUqT8COi4oEL0NP' --secret 'ETwNn7XpyR2H4wrzcL1WcCp6YGmF0Vx1COA3hOpa74obw'
 */

const command = require('commander');

const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  UsersTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Users'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const BATCH_SIZE = 20;

command
  .version('0.1.0')
  .usage('[options]')
  .option('-t, --token <token>', 'twitter auth token to be used for lookup')
  .option('-s, --secret <secret>', 'twitter auth secret to be used for lookup')
  .parse(process.argv);

class FetchUserLocation {
  constructor() {
    const oThis = this;

    oThis.authToken = command.token;
    oThis.authSecret = command.secret;

    oThis.userIds = [];
    oThis.twitterIds = [];
    oThis.userIdToUsernameMap = {};
    oThis.twitterIdToUsernameMap = {};
    oThis.nextPaginationTimestamp = null;
    oThis.locationData = {};
  }

  async perform() {
    const oThis = this;

    // Fetch all userIds
    while (true) {
      await oThis._fetchUsers(oThis.nextPaginationTimestamp);

      if (!oThis.nextPaginationTimestamp) {
        break;
      }
    }

    // Fetch twitter ids in batches
    const userIds = oThis.userIds.slice(); // Slice clones the array
    while (userIds.length > 0) {
      const userIdBatch = userIds.splice(0, BATCH_SIZE);
      await oThis._fetchTwitterIds(userIdBatch);
    }

    let twitterIds = oThis.twitterIds.slice(); // Slice clones the array
    while (twitterIds.length > 0) {
      const twitterIdsBatch = twitterIds.splice(0, BATCH_SIZE);
      await oThis._fetchLocations(twitterIdsBatch);
    }

    return responseHelper.successWithData(oThis.locationData);
  }

  async _fetchUsers(paginationTimestamp) {
    const oThis = this;

    let userData = await new UserModel().search({
      query: null,
      limit: BATCH_SIZE,
      paginationTimestamp: paginationTimestamp,
      isOnlyNameSearch: false,
      fetchAll: false
    });

    oThis.userIds = oThis.userIds.concat(userData.userIds);

    for (let userId in userData.userDetails) {
      oThis.userIdToUsernameMap = oThis.userIdToUsernameMap || {};
      oThis.userIdToUsernameMap[userId] = userData.userDetails[userId].userName;
    }

    const lastUserId = userData.userIds.length > 0 ? userData.userIds[userData.userIds.length - 1] : null;
    oThis.nextPaginationTimestamp = lastUserId ? userData.userDetails[lastUserId].createdAt : null;
  }

  async _fetchTwitterIds(userIds) {
    const oThis = this;

    const twitterUserCacheRsp = await new TwitterUserByUserIdsCache({
      userIds: userIds
    }).fetch();

    if (twitterUserCacheRsp.isFailure()) {
      return Promise.reject(twitterUserCacheRsp);
    }

    for (let userId in twitterUserCacheRsp.data) {
      let twitterId = twitterUserCacheRsp.data[userId].id;
      oThis.twitterIds.push(twitterId);
      oThis.twitterIdToUsernameMap = oThis.twitterIdToUsernameMap || {};
      oThis.twitterIdToUsernameMap[twitterId] = oThis.userIdToUsernameMap[userId];
    }
  }

  async _fetchLocations(twitterIds) {
    const oThis = this;

    let reqParams = {
      oAuthToken: oThis.authToken,
      oAuthTokenSecret: oThis.authSecret,
      twitterIds: twitterIds
    };

    let lookupResp = await new UsersTwitterRequestClass().lookup(reqParams);

    let lookupData = lookupResp.data.response;

    for (let ind = 0; ind < twitterIds.length; ind++) {
      let twitterid = twitterIds[ind];
      if (lookupData.hasOwnProperty(twitterid)) {
        oThis.locationData[oThis.twitterIdToUsernameMap[twitterid]] = lookupData[twitterid].location;
      }
    }
  }
}

new FetchUserLocation()
  .perform()
  .then(function(resp) {
    console.log(resp.data);
  })
  .catch(function(err) {
    console.error(err);
  });

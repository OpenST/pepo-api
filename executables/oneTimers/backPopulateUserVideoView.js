const rootPrefix = '../..',
  UserVideoViewModel = require(rootPrefix + '/app/models/cassandra/UserVideoView'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UserNotificationVisitDetailModel = require(rootPrefix + '/app/models/cassandra/UserNotificationVisitDetail'),
  PersonalizedFeedByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/PersonalizedFeedByUserId'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class BackPopulateUserVideoView {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    oThis.tableName = new UserVideoViewModel().queryTableName;
    oThis.videoPublishData = {};
    oThis.feedToVideoMap = [];

    await oThis.getAllPublishedVideoIds();
    await oThis.populateForUsers();
  }

  async getAllPublishedVideoIds() {
    const oThis = this;

    const dbRows = await new FeedModel()
      .select('id, primary_external_entity_id, pagination_identifier')
      .order_by('pagination_identifier desc')
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      const dbRow = dbRows[index];
      oThis.videoPublishData[dbRow.pagination_identifier] = oThis.videoPublishData[dbRow.pagination_identifier] || [];
      oThis.videoPublishData[dbRow.pagination_identifier].push(dbRow.primary_external_entity_id);
      oThis.feedToVideoMap[dbRow.id] = dbRow.primary_external_entity_id;
    }

    logger.log('Total videos from feed =====', dbRows.length);
  }

  async populateForUsers() {
    const oThis = this;

    const dbRows = await new UserModel().select('id').fire();
    let promises = [];

    logger.log('Total Users=====', dbRows.length);

    for (let index = 0; index < dbRows.length; index++) {
      const userId = dbRows[index].id;
      promises.push(oThis.populateVideoViewForUserId(userId));
      if (promises.length >= 5) {
        await Promise.all(promises);
        promises = [];
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  async populateVideoViewForUserId(userId) {
    const oThis = this;

    logger.log('Populate For User Id=====', userId);

    let seenVideoIds = [];

    const lastSeenPaginationIdentifier = await oThis.getLastVisitTime(userId);

    logger.log('lastSeenPaginationIdentifier For User Id=====', userId, lastSeenPaginationIdentifier);

    for (let paginationIdentifier in oThis.videoPublishData) {
      const videoIds = oThis.videoPublishData[paginationIdentifier];
      if (lastSeenPaginationIdentifier >= paginationIdentifier) {
        seenVideoIds = seenVideoIds.concat(videoIds);
      }
    }

    logger.log('TOTAL seenVideoIds as per last visit time For User Id=====', userId, seenVideoIds.length);

    if (seenVideoIds.length === 0) {
      return;
    }

    const unseenFeedIds = await oThis.fetchFeedIdsForUserFromCache(userId);

    logger.log('TOTAL unseenFeedIds from cache For User Id=====', userId, unseenFeedIds.length);

    for (let i = 0; i < unseenFeedIds.length; i++) {
      let videoId = oThis.feedToVideoMap[unseenFeedIds[i]];
      if (videoId) {
        let index = seenVideoIds.indexOf(videoId);
        if (index > -1) {
          seenVideoIds.splice(index, 1);
        }
      }
    }

    if (seenVideoIds.length === 0) {
      return;
    }

    logger.win('TOTAL seenVideoIds after deductiong feeds from cache For User Id=====', userId, seenVideoIds.length);

    while (seenVideoIds.length > 0) {
      const videoIds = seenVideoIds.splice(0, 100);
      await oThis.insertInCassandra(userId, videoIds);
    }
  }

  async fetchFeedIdsForUserFromCache(userId) {
    const oThis = this;

    const cacheResp = await new PersonalizedFeedByUserIdCache({ userId: userId }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    if (CommonValidators.validateNonEmptyObject(cacheResp.data)) {
      return cacheResp.data['unseenFeedIds'] || [];
    } else {
      return [];
    }
  }

  async getLastVisitTime(userId) {
    const oThis = this;

    const queryParams = {
      userId: userId
    };

    const userNotificationVisitDetailsResp = await new UserNotificationVisitDetailModel().fetchLatestSeenFeedTime(
      queryParams
    );

    return Math.round((userNotificationVisitDetailsResp.latestSeenFeedTime || 0) / 1000);
  }

  async insertInCassandra(userId, seenVideoIds) {
    const oThis = this,
      queries = [];

    const query = `INSERT INTO ${oThis.tableName}(user_id, video_id, last_view_at) VALUES(?, ?, ?) `;

    for (let i = 0; i < seenVideoIds.length; i++) {
      const updateParam = [userId, seenVideoIds[i], Date.now()];
      queries.push({ query: query, params: updateParam });
    }

    if (queries.length > 0) {
      await new UserVideoViewModel().batchFire(queries);
    }
  }
}

new BackPopulateUserVideoView()
  .perform()
  .then(function() {
    logger.win('All UserVideoView table back-populated successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error in back-populating. Error: ', err);
    process.exit(1);
  });

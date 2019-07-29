/**
 * Module for After sign up job
 *
 * @module executables/bgJobProcessor/AfterSignUpJob
 */

const rootPrefix = '../..',
  BgJob = require(rootPrefix + '/lib/BgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  AddUpdateUserBioKlass = require(rootPrefix + '/lib/user/profile/AddUpdateBio'),
  TwitterUserConnectionByUser1PaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/TwitterUserConnectionByUser1Pagination'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  twitterUserConnectionConstants = require(rootPrefix + '/lib/globalConstant/twitterUserConnection'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class AfterSignUpJob {
  /**
   * Construtor
   *
   * @param {Object} params
   * @param {String} params.bio
   * @param {String/Number} params.twitterUserId
   * @param {Number} params.userId
   * @param {Number} params.profileImageId
   */
  constructor(params) {
    const oThis = this;

    oThis.bio = params.bio;
    oThis.twitterId = params.twitterId;
    oThis.twitterUserId = params.twitterUserId;
    oThis.userId = params.userId;
    oThis.profileImageId = params.profileImageId;
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;
    const promisesArray = [];

    await oThis._validateAndSanitize();

    promisesArray.push(oThis._processBio());
    promisesArray.push(oThis._enqueueProfileImageResizer());
    promisesArray.push(oThis._syncFriendsAndFollowers());
    promisesArray.push(oThis._updateTwitterUserConnections());

    await Promise.all(promisesArray);
  }

  /**
   * Validate and Sanitize
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;
  }

  /**
   * Process users bio and store it in DB.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processBio() {
    const oThis = this;

    await new AddUpdateUserBioKlass({
      bio: oThis.bio,
      userId: oThis.userId
    }).perform();
  }

  /**
   * Sync users friends and followers
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncFriendsAndFollowers() {
    const oThis = this;

    let messagePayload = {
      twitterId: oThis.twitterId
    };

    await BgJob.enqueue(bgJobConstants.twitterFriendsSyncJobTopic, messagePayload);
  }

  /**
   * Update isTwitterUser2RegisteredProperty property in TwitterUserConnection
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTwitterUserConnections() {
    const oThis = this;

    let page = 1,
      limit = 100;

    let queryParams = {
      limit: limit,
      twitterUser2Id: oThis.twitterUserId
    };

    const propertyVal =
      twitterUserConnectionConstants.invertedProperties[
        twitterUserConnectionConstants.isTwitterUser2RegisteredProperty
      ];

    while (true) {
      const twitterUser1Ids = [],
        twitterUserConnectionIds = [];

      queryParams['page'] = page;
      let resp = await new TwitterUserConnectionModel().fetchByTwitterUser2Id(queryParams);

      for (let twitterUserConnectionId in resp) {
        twitterUserConnectionIds.push(twitterUserConnectionId);
        twitterUser1Ids.push(resp[twitterUserConnectionId].twitterUser1Id);
      }

      if (twitterUser1Ids.length < 1) {
        return;
      }

      await new TwitterUserConnectionModel()
        .update(['properties = properties | ?', propertyVal])
        .where({
          id: twitterUserConnectionIds
        })
        .fire();

      const promisesArray = [];

      for (let i = 0; i < twitterUser1Ids.length; i++) {
        let twitterUser1Id = twitterUser1Ids[i];
        let promiseResp = new TwitterUserConnectionByUser1PaginationCache({
          twitterUser1Id: twitterUser1Id
        }).clear();

        promisesArray.push(promiseResp);
      }

      await Promise.all(promisesArray);

      page = page + 1;
    }
  }

  /**
   * Enqueue profile image resizer
   *
   * @returns {Promise<void>}
   */
  async _enqueueProfileImageResizer() {
    const oThis = this;

    if (oThis.profileImageId) {
      await BgJob.enqueue(bgJobConstants.imageResizer, {
        userId: oThis.userId,
        imageId: oThis.profileImageId
      });
    }
  }
}

module.exports = AfterSignUpJob;

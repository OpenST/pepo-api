const rootPrefix = '../../..',
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  AddUpdateUserBioKlass = require(rootPrefix + '/lib/user/profile/AddUpdateBio'),
  TwitterUserConnectionByUser1PaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/TwitterUserConnectionByUser1Pagination'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  twitterUserConnectionConstants = require(rootPrefix + '/lib/globalConstant/twitterUserConnection');

/**
 * Class for after signup job.
 *
 * @class AfterSignUpJob
 */
class AfterSignUpJob {
  /**
   * Constructor for after signup job.
   *
   * @param {object} params
   * @param {string} params.bio
   * @param {string/number} params.twitterId
   * @param {string/number} params.twitterUserId
   * @param {number} params.userId
   * @param {number} params.profileImageId
   * @param {number} params.inviterCodeId
   * @param {number} params.userInviteCodeId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.bio = params.bio;
    oThis.twitterId = params.twitterId;
    oThis.twitterUserId = params.twitterUserId;
    oThis.userId = params.userId;
    oThis.profileImageId = params.profileImageId;
    oThis.inviterCodeId = params.inviterCodeId;
    oThis.userInviteCodeId = params.userInviteCodeId; // If user was part of prelaunch flow, then use that same invite code.
  }

  /**
   * Main performer for class.
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
    promisesArray.push(oThis._addUserInviteCode());

    await Promise.all(promisesArray);
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    // Nothing to do.
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
   * Sync users friends and followers.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncFriendsAndFollowers() {
    const oThis = this;

    const messagePayload = {
      twitterId: oThis.twitterId
    };

    await bgJob.enqueue(bgJobConstants.twitterFriendsSyncJobTopic, messagePayload);
  }

  /**
   * Update isTwitterUser2RegisteredProperty property in TwitterUserConnection
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTwitterUserConnections() {
    const oThis = this;

    const limit = 100;
    let page = 1;

    const queryParams = {
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

      queryParams.page = page;
      const resp = await new TwitterUserConnectionModel().fetchByTwitterUser2Id(queryParams);

      for (const twitterUserConnectionId in resp) {
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

      for (let index = 0; index < twitterUser1Ids.length; index++) {
        const twitterUser1Id = twitterUser1Ids[index];
        const promiseResp = new TwitterUserConnectionByUser1PaginationCache({
          twitterUser1Id: twitterUser1Id
        }).clear();

        promisesArray.push(promiseResp);
      }

      await Promise.all(promisesArray);

      page += 1;
    }
  }

  /**
   * Add invite code of user
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addUserInviteCode() {
    const oThis = this;

    // Check if user invite code is already present, then update it
    let inviteCodeObj = {};
    if (oThis.userInviteCodeId) {
      // TODO: Replace this with cache built by Tejas
      inviteCodeObj = await new InviteCodeModel().fetchById(oThis.userInviteCodeId);
    }

    let promisesArray = [],
      inviteModelObj = new InviteCodeModel();

    // If invite code object is present, then update it
    if (inviteCodeObj.id) {
      oThis.inviterCodeId = inviteCodeObj.inviterCodeId;

      let promise = inviteModelObj
        .where({ id: inviteCodeObj.id })
        .update({ user_id: oThis.userId })
        .fire();

      promisesArray.push(promise);
      promisesArray.push(InviteCodeModel.flushCache(inviteCodeObj));
    } else {
      let insertParams = {
        code: inviteCodeConstants.generateInviteCode,
        invite_limit: inviteCodeConstants.inviteMaxLimit,
        user_id: oThis.userId,
        inviter_code_id: oThis.inviterCodeId
      };

      promisesArray.push(inviteModelObj.insert(insertParams).fire());
      promisesArray.push(InviteCodeModel.flushCache(insertParams));
    }

    // If inviter is present, then update its invited user count.
    if (oThis.inviterCodeId) {
      // TODO: Replace this with cache built by Tejas
      let inviterCodeObj = await new InviteCodeModel().fetchById(oThis.inviterCodeId);
      promisesArray.push(inviteModelObj.updateInvitedUserCount(oThis.inviterCodeId));
      promisesArray.push(InviteCodeModel.flushCache(inviterCodeObj));
    }

    await Promise.all(promisesArray);
  }

  /**
   * Enqueue profile image resizer.
   *
   * @returns {Promise<void>}
   */
  async _enqueueProfileImageResizer() {
    const oThis = this;

    if (oThis.profileImageId) {
      await bgJob.enqueue(bgJobConstants.imageResizer, {
        userId: oThis.userId,
        imageId: oThis.profileImageId
      });
    }
  }
}

module.exports = AfterSignUpJob;

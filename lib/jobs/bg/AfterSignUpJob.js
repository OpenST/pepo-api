const rootPrefix = '../../..',
  FollowArangoModel = require(rootPrefix + '/app/models/arango/Follow'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  UserArangoModel = require(rootPrefix + '/app/models/arango/User'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook'),
  AddUpdateUserBioKlass = require(rootPrefix + '/lib/user/profile/AddUpdateBio'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  AddContactInPepoCampaign = require(rootPrefix + '/lib/email/hookCreator/AddContact'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  InviteCodeByIdCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeById'),
  PrelaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  prelaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  UserUtmDetailModel = require(rootPrefix + '/app/models/mysql/UserUtmDetail'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  userUtmDetailsConstants = require(rootPrefix + '/lib/globalConstant/userUtmDetail'),
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
   * @param {boolean} params.isCreator
   * @param {object} params.utmParams: utm params used while signup.
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.bio = params.bio;
    oThis.twitterId = params.twitterId;
    oThis.twitterUserId = params.twitterUserId;
    oThis.profileImageId = params.profileImageId;
    oThis.isCreator = params.isCreator;
    oThis.inviterCodeId = params.inviterCodeId;
    oThis.userInviteCodeId = params.userInviteCodeId; // If user was part of prelaunch flow, then use that same invite code.
    oThis.utmParams = params.utmParams || {};
    oThis.newInvitee = true;

    oThis.inviterCodeObj = null;
    oThis.userObj = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validateAndSanitize();

    const promisesArray = [
      oThis._processBio(),
      oThis._enqueueProfileImageResizer(),
      oThis._syncFriendsAndFollowers(),
      oThis._updateTwitterUserConnections(),
      oThis._addUserInviteCode(),
      oThis._insertUtmParams()
    ];
    await Promise.all(promisesArray);

    const promisesArray2 = [oThis._addUsersForPepoCampaigns(), oThis._addUserInGraph()];

    await Promise.all(promisesArray2);
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    oThis.userObj = await oThis._fetchUser(oThis.userId);
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

        promisesArray.push(
          TwitterUserConnectionModel.flushCache({ twitterUser1Id: twitterUser1Id, twitterUser2Id: oThis.twitterUserId })
        );
      }

      promisesArray.push(oThis._updateGraphDb(twitterUser1Ids));
      await Promise.all(promisesArray);

      page += 1;
    }
  }

  /**
   * Update Follow Edge on graph db.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateGraphDb(twitterUser1Ids) {
    const oThis = this;

    const fromUserIds = [];

    const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: twitterUser1Ids
    }).fetch();

    for (let twitterUserId in twitterUserByIdsCacheResp.data) {
      fromUserIds.push(twitterUserByIdsCacheResp.data[twitterUserId].userId);
    }

    const params = {
      updateKey: 'isTwitterFollower',
      updateVal: true,
      toUserId: oThis.userId
    };

    const promises = [];
    for (let i = 0; i < fromUserIds.length; i++) {
      params['fromUserId'] = fromUserIds[i];
      const promise = new FollowArangoModel().addUpdateFollower(params);
      promises.push(promise);
    }

    await Promise.all(promises);
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
      let cacheResp = await new InviteCodeByIdCache({ id: oThis.userInviteCodeId }).fetch();
      inviteCodeObj = cacheResp.data;
    }

    let inviteLimit = oThis.isCreator ? inviteCodeConstants.infiniteInviteLimit : inviteCodeConstants.inviteMaxLimit;

    // If invite code object is present, then update it
    if (inviteCodeObj.id) {
      if (oThis.inviterCodeId && inviteCodeObj.inviterCodeId == oThis.inviterCodeId) {
        oThis.newInvitee = false;
      }

      await new InviteCodeModel()
        .update({
          user_id: oThis.userId,
          inviter_code_id: oThis.inviterCodeId || null,
          invite_limit: inviteLimit
        })
        .where({ id: inviteCodeObj.id })
        .fire();

      await InviteCodeModel.flushCache(inviteCodeObj);
    } else {
      let insertParams = {
        code: inviteCodeConstants.generateInviteCode,
        kind: inviteCodeConstants.invertedKinds[inviteCodeConstants.userKind],
        invite_limit: inviteLimit,
        user_id: oThis.userId,
        inviter_code_id: oThis.inviterCodeId || null
      };

      let insertResponse = await new InviteCodeModel().insert(insertParams).fire();

      await InviteCodeModel.flushCache({
        id: insertResponse.insertId,
        code: insertParams.code,
        userId: insertParams.user_id
      });
    }

    // If inviter is present, then update its invited user count.
    if (oThis.inviterCodeId) {
      let cacheResp = await new InviteCodeByIdCache({ id: oThis.inviterCodeId }).fetch();

      oThis.inviterCodeObj = cacheResp.data;
      await new InviteCodeModel().updateInvitedUserCount(oThis.inviterCodeId);
      await InviteCodeModel.flushCache(oThis.inviterCodeObj);
    }
  }

  /**
   * Fetch user.
   *
   * @param {number} userId
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchUser(userId) {
    const cacheResp = await new UserCache({ ids: [userId] }).fetch();

    return cacheResp.data[userId];
  }

  /**
   * Add contact in pepo campaign.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addContactInPepoCampaign() {
    const oThis = this;

    const addContactParams = {
      receiverEntityId: oThis.userId,
      receiverEntityKind: emailServiceApiCallHookConstants.userEmailEntityKind,
      customDescription: 'Contact add for already double opt in email.',
      customAttributes: {
        [emailServiceApiCallHookConstants.appSignupAttribute]: 1
      }
    };

    await new AddContactInPepoCampaign(addContactParams).perform();
  }

  async _addUsersForPepoCampaigns() {
    const oThis = this;

    let userData = oThis.userObj;

    if (userData && userData.email) {
      await oThis._addContactInPepoCampaign();
    }

    // If inviter is present then send email and inviter is a user code
    if (oThis.inviterCodeObj && oThis.inviterCodeObj.kind == inviteCodeConstants.userKind) {
      await oThis._sendEmailToInviter();
    }
  }

  /**
   * Send email to inviter
   * @return {Promise<void>}
   * @private
   */
  async _sendEmailToInviter() {
    const oThis = this;

    let transactionMailParams = null,
      blockedUser = false;

    if (oThis.inviterCodeObj.userId) {
      let inviterUserData = await oThis._fetchUser(oThis.inviterCodeObj.userId);

      if (inviterUserData && inviterUserData.status != userConstant.activeStatus) {
        blockedUser = true;
      }

      // If user is present and email is opted in.
      if (!blockedUser && inviterUserData && inviterUserData.email) {
        let twHandle = await oThis._getTwitterHandle(oThis.userId);
        transactionMailParams = {
          receiverEntityId: inviterUserData.id,
          receiverEntityKind: emailServiceApiCallHookConstants.userEmailEntityKind,
          customDescription: 'app invite signup using invite code',
          templateVars: {
            pepo_api_domain: 1,
            twitter_handle: twHandle
          }
        };
      }
    }

    // If receiver is not set yet, then query for prelaunch invite
    if (!transactionMailParams && !blockedUser) {
      let row = await new PrelaunchInviteModel()
        .select('*')
        .where({ invite_code_id: oThis.inviterCodeObj.id })
        .fire();

      // If prelaunch invite code is present then check its double opt in
      if (row[0] && row[0].status == prelaunchInviteConstants.invertedStatuses[prelaunchInviteConstants.doptinStatus]) {
        let twHandle = await oThis._getTwitterHandle(oThis.userId);
        transactionMailParams = {
          receiverEntityId: row[0].id,
          receiverEntityKind: emailServiceApiCallHookConstants.preLaunchInviteEntityKind,
          customDescription: 'app invite signup using prelaunch invite code',
          templateVars: {
            pepo_api_domain: 1,
            twitter_handle: twHandle
          }
        };
      }
    }

    if (transactionMailParams) {
      transactionMailParams.templateName = emailServiceApiCallHookConstants.inviteeUserAppSignupTemplateName;
      await new SendTransactionalMail(transactionMailParams).perform();
    }
  }

  /**
   * Get twitter handle.
   *
   * @param {number} userId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTwitterHandle(userId) {
    const twitterUserCacheRsp = await new TwitterUserByUserIdsCache({
      userIds: [userId]
    }).fetch();

    const twitterUserObj = twitterUserCacheRsp.data[userId];

    const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: [twitterUserObj.id]
    }).fetch();

    return twitterUserByIdsCacheResp.data[twitterUserObj.id].handle;
  }

  /**
   * Enqueue profile image resizer.
   *
   * @returns {Promise<void>}
   * @private
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

  /**
   * Add user in Social Graph.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addUserInGraph() {
    const oThis = this;

    const insertParams = {
      id: oThis.userObj.id,
      createdAt: oThis.userObj.createdAt
    };

    await new UserArangoModel().createEntry(insertParams);
  }

  /**
   * Insert utm params used while signup by user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertUtmParams() {
    const oThis = this;

    if (CommonValidators.validateNonEmptyObject(oThis.utmParams)) {
      await new UserUtmDetailModel({}).insertUserUtmDetails({
        userId: oThis.userId,
        kind: userUtmDetailsConstants.signUpKind,
        utmCampaign: oThis.utmParams.utmCampaign,
        utmMedium: oThis.utmParams.utmMedium,
        utmSource: oThis.utmParams.utmSource
      });
    }
  }
}

module.exports = AfterSignUpJob;

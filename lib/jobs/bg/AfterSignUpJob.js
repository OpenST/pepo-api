const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  UserUtmDetailModel = require(rootPrefix + '/app/models/mysql/UserUtmDetail'),
  AddUpdateUserBioKlass = require(rootPrefix + '/lib/user/profile/AddUpdateBio'),
  AddContactInPepoCampaign = require(rootPrefix + '/lib/email/hookCreator/AddContact'),
  InviteCodeByIdCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeById'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  userUtmDetailsConstants = require(rootPrefix + '/lib/globalConstant/userUtmDetail'),
  twitterUserConnectionConstants = require(rootPrefix + '/lib/globalConstant/twitterUserConnection'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

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
   * @param {boolean} params.isUserLogin
   * @param {boolean} params.isCreator
   * @param {object} params.utmParams: utm params used while signup.
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
    oThis.isCreator = params.isCreator;
    oThis.inviterCodeId = params.inviterCodeId;
    oThis.isUserLogin = params.isUserLogin; // If user is present in system before but new social account is connected.
    oThis.utmParams = params.utmParams || {};
    oThis.newInvitee = true;
    oThis.inviteeUserData = {};

    oThis.inviterCodeObj = null;
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

    await oThis._addUsersForPepoCampaigns();
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

    if (oThis.bio) {
      await new AddUpdateUserBioKlass({
        bio: oThis.bio,
        userId: oThis.userId
      }).perform();
    }
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
   * Sync users friends and followers.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncFriendsAndFollowers() {
    const oThis = this;

    // User may be logged in as github, google or apple.
    if (oThis.twitterId) {
      const messagePayload = {
        twitterId: oThis.twitterId
      };
      await bgJob.enqueue(bgJobConstants.twitterFriendsSyncJobTopic, messagePayload);
    }
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

    // User may be logged in as github, google or apple.
    if (oThis.twitterUserId) {
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
            TwitterUserConnectionModel.flushCache({
              twitterUser1Id: twitterUser1Id,
              twitterUser2Id: oThis.twitterUserId
            })
          );
        }

        await Promise.all(promisesArray);

        page += 1;
      }
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

    // If user is already present in system but its connecting another account
    // The do nothing
    if (oThis.isUserLogin) {
      return;
    }
    let inviteLimit = oThis.isCreator ? inviteCodeConstants.infiniteInviteLimit : inviteCodeConstants.inviteMaxLimit;

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

  /**
   * Add user for pepo campaigns.
   *
   * Sets oThis.inviteeUserData
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addUsersForPepoCampaigns() {
    const oThis = this;

    // If user is already present in system but its connecting another account
    // The do nothing
    if (oThis.isUserLogin) {
      return;
    }

    oThis.inviteeUserData = await oThis._fetchUser(oThis.userId);

    if (oThis.inviteeUserData && oThis.inviteeUserData.email) {
      await oThis._addContactInPepoCampaign();
    }

    await oThis._sendEmailToInviter();
  }

  /**
   * Send email to inviter.
   *
   * @return {Promise<void>}
   * @private
   */
  async _sendEmailToInviter() {
    const oThis = this;

    // If inviter is present then send email and inviter is a user code
    if (
      !oThis.inviterCodeObj ||
      !oThis.inviterCodeObj.userId ||
      !(oThis.inviterCodeObj.kind == inviteCodeConstants.userKind)
    ) {
      return;
    }

    let transactionMailParams = null,
      blockedUser = false;

    let inviterUserData = await oThis._fetchUser(oThis.inviterCodeObj.userId);
    if (inviterUserData && inviterUserData.status != userConstant.activeStatus) {
      blockedUser = true;
    }

    // If user is present and email is opted in.
    if (!blockedUser && inviterUserData && inviterUserData.email) {
      transactionMailParams = {
        receiverEntityId: inviterUserData.id,
        receiverEntityKind: emailServiceApiCallHookConstants.userEmailEntityKind,
        customDescription: 'app invite signup using invite code',
        templateVars: {
          pepo_api_domain: 1,
          name: oThis.inviteeUserData.name
        }
      };
    }

    if (transactionMailParams) {
      transactionMailParams.templateName = emailServiceApiCallHookConstants.inviteeUserAppSignupTemplateName;
      await new SendTransactionalMail(transactionMailParams).perform();
    }
  }

  /**
   * Insert utm params used while signup by user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertUtmParams() {
    const oThis = this;

    // If user is already present in system but its connecting another account
    // The do nothing
    if (oThis.isUserLogin) {
      return;
    }

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

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
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class AfterSignUpJob {
  /**
   * Construtor
   *
   * @param {Object} params
   * @param {String} params.bio
   * @param {String/Number} params.twitterId
   * @param {Number} params.userId
   * @param {Number} params.profileImageId
   */
  constructor(params) {
    const oThis = this;

    oThis.bio = params.bio;
    oThis.twitterId = params.twitterId;
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

    await oThis._validateAndSanitize();

    await oThis._processBio();

    await oThis._enqueueProfileImageResizer();

    await oThis._syncFriendsAndFollowers();

    //todo: Update TwitterUserConnection for twitterUser2 and
    // flush cache for some twitterUser1Ids
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

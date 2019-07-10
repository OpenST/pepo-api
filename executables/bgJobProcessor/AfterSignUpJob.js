/**
 * Module for After sign up job
 *
 * @module executables/bgJobProcessor/AfterSignUpJob
 */

const rootPrefix = '../..',
  BgJob = require(rootPrefix + '/lib/BgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class AfterSignUpJob {
  /**
   * Construtor
   *
   * @param {Object} params
   * @param {String} params.bio
   * @param {String/Number} params.twitterId
   * @param {Number} params.userId
   */
  constructor(params) {
    const oThis = this;

    oThis.bio = params.bio;
    oThis.twitterId = params.twitterId;
    oThis.userId = params.userId;
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

    await oThis._syncFriendsAndFollowers();
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
}

module.exports = AfterSignUpJob;

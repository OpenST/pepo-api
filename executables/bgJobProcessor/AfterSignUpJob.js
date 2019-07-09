/**
 * Module for After sign up job
 *
 * @module executables/bgJobProcessor/AfterSignUpJob
 */

const rootPrefix = '../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class AfterSignUpJob {
  constructor() {}

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
  }
}

module.exports = AfterSignUpJob;

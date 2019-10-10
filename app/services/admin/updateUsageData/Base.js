const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Base class for usage data update.
 *
 * @class UsageDataBase
 */
class UsageDataBase extends ServiceBase {
  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis.enqueue();

    return responseHelper.successWithData({});
  }

  /**
   * Returns background job kind.
   */
  get kind() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Enqueue in rabbitMq.
   *
   * @returns {Promise<void>}
   */
  async enqueue() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = UsageDataBase;

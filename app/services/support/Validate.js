const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class to validate support URL.
 *
 * @class ValidateSupportUrl
 */
class ValidateSupportUrl extends ServiceBase {
  /**
   * Constructor to validate support URL.
   *
   * @param {object} params
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityTypeConstants.supportValidation]: {
        userId: oThis.currentUser.id,
        externalUserId: oThis.currentUser.externalUserId,
        userName: oThis.currentUser.name
      }
    });
  }
}

module.exports = ValidateSupportUrl;

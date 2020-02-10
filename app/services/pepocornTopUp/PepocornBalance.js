const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetPepocornBalance = require(rootPrefix + '/lib/pepocorn/GetPepocornBalance'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class to get pepocorn balance of current user.
 *
 * @class PepocornBalance
 */
class PepocornBalance extends ServiceBase {
  /**
   * Constructor to get pepocorn balance of current user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = params.current_user.id;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const pepoCornBalanceObject = await new GetPepocornBalance({ userIds: [oThis.currentUserId] }).perform();

    const serviceResponse = { [entityTypeConstants.pepocornBalance]: pepoCornBalanceObject[oThis.currentUserId] };

    return responseHelper.successWithData(serviceResponse);
  }
}

module.exports = PepocornBalance;

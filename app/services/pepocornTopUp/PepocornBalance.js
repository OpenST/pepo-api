const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  PepocornBalanceByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PepocornBalanceByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType');

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

    const cacheResponse = await new PepocornBalanceByUserIdsCache({ userIds: [oThis.currentUserId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    let pepoCornBalanceEntity = cacheResponse.data[oThis.currentUserId];

    if (!CommonValidators.validateNonEmptyObject(pepoCornBalanceEntity)) {
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      pepoCornBalanceEntity = {
        userId: oThis.currentUserId,
        balance: 0,
        updatedAt: currentTimeInSeconds
      };
    }

    const serviceResponse = { [entityType.pepocornBalance]: pepoCornBalanceEntity };

    return responseHelper.successWithData(serviceResponse);
  }
}

module.exports = PepocornBalance;

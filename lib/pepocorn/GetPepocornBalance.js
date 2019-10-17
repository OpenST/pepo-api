const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  PepocornBalanceByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PepocornBalanceByUserIds');

/**
 * Class to get pepocorn balance of users.
 *
 * @class GetPepocornBalance
 */
class GetPepocornBalance {
  /**
   * Constructor to get pepocorn balance of users.
   *
   * @param {object} params
   * @param {array<number>} params.userIds
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<result>}
   */
  async perform() {
    const oThis = this;

    return oThis.asyncPerform();
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   */
  async asyncPerform() {
    const oThis = this;

    const cacheResponse = await new PepocornBalanceByUserIdsCache({ userIds: oThis.userIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cachedData = cacheResponse.data;

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];

      /*
      We do the following because it is possible that there might be no entry in pepocorn_balances table
      for that particular user. So we set the balance for the user as 0.
      */
      if (!CommonValidators.validateNonEmptyObject(cachedData[userId])) {
        const currentTimeInSeconds = Math.floor(Date.now() / 1000);
        cachedData[userId] = {
          userId: userId,
          balance: 0,
          updatedAt: currentTimeInSeconds
        };
      }
    }

    return cachedData;
  }
}

module.exports = GetPepocornBalance;

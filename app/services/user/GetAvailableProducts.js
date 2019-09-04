const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  configStrategy = require(rootPrefix + '/lib/providers/configStrategy'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection');

/**
 * Class to get in app purchase products
 *
 * @class
 */
class GetAvailableProducts extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   * @param params.current_user {Object} - Current user
   * @param params.os {String} - os (android/ios)
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.os = params.os;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    let responseData = {
      products: [
        {
          id: 'PROD.ID.1',
          amount_in_usd: '1',
          amount_in_pepo: '1000',
          uts: '1567601491491'
        },
        {
          id: 'PROD.ID.2',
          amount_in_usd: '2',
          amount_in_pepo: '2000',
          uts: '1567601491491'
        },
        {
          id: 'PROD.ID.3',
          amount_in_usd: '3',
          amount_in_pepo: '3000',
          uts: '1567601491491'
        }
      ]
    };

    return responseHelper.successWithData(responseData);
  }
}

module.exports = GetAvailableProducts;

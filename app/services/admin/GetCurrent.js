const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  AdminByIdCache = require(rootPrefix + '/lib/cacheManagement/single/AdminById'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class GetCurrentAdmin extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.current_admin: User Admin
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.adminId = params.current_admin.id;
    oThis.pricePoints = {};
    oThis.tokenDetails = {};
  }

  /**
   * perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAdmin();

    return Promise.resolve(oThis._serviceResponse());
  }

  /**
   * Fetch Secure user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _fetchAdmin() {
    const oThis = this;
    logger.log('fetch Admin');

    const cacheResponse = await new AdminByIdCache({ id: oThis.adminId }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.currentAdmin = cacheResponse.data || {};

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Response for service
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      admin: oThis.currentAdmin
    });
  }
}

module.exports = GetCurrentAdmin;

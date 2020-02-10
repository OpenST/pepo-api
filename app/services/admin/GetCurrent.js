const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AdminModel = require(rootPrefix + '/app/models/mysql/admin/Admin'),
  AdminByIdCache = require(rootPrefix + '/lib/cacheManagement/single/AdminById'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class to get current admin.
 *
 * @class GetCurrentAdmin
 */
class GetCurrentAdmin extends ServiceBase {
  /**
   * Constructor to get current admin.
   *
   * @param {object} params
   * @param {object} params.current_admin: User Admin
   * @param {number} params.current_admin.id: User Admin Id.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.adminId = params.current_admin.id;

    oThis.currentAdmin = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAdmin();

    return responseHelper.successWithData({
      admin: oThis.currentAdmin
    });
  }

  /**
   * Fetch admin.
   *
   * @sets oThis.currentAdmin
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAdmin() {
    const oThis = this;

    logger.log('Fetching admin.');

    const cacheResponse = await new AdminByIdCache({ id: oThis.adminId }).fetch();
    if (cacheResponse.isFailure() || !CommonValidators.validateNonEmptyObject(cacheResponse.data)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_am_gc_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: {}
        })
      );
    }

    oThis.currentAdmin = new AdminModel().safeFormattedData(cacheResponse.data[oThis.adminId]);
  }
}

module.exports = GetCurrentAdmin;

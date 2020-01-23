const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

// Declare error config.
const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

/**
 * Base class for all services.
 *
 * @class ServicesBase
 */
class ServicesBase {
  /**
   * Constructor for base class for all services.
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.token = null;
    oThis.tokenId = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  perform() {
    const oThis = this;

    return oThis._asyncPerform().catch(async function(err) {
      let errorObject = err;

      if (!responseHelper.isCustomResult(err)) {
        errorObject = responseHelper.error({
          internal_error_identifier: 'a_s_b_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: err.toString(), stack: err.stack },
          error_config: errorConfig
        });

        await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
        logger.error(' In catch block of services/Base.js Error is: ', err);
      }
      logger.error(' In catch block of services/Base.js', JSON.stringify(errorObject.getDebugData()));

      return errorObject;
    });
  }

  /**
   * Parse pagination identifier.
   *
   * @param {string} paginationIdentifier
   *
   * @return {*}
   * @private
   */
  _parsePaginationParams(paginationIdentifier) {
    return basicHelper.decryptPageIdentifier(paginationIdentifier);
  }

  /**
   * Validate page size.
   *
   * @sets oThis.limit
   *
   * @return {Promise<never>}
   * @private
   */
  async _validatePageSize() {
    const oThis = this;

    const limitVas = CommonValidators.validateAndSanitizeLimit(
      oThis._currentPageLimit(),
      oThis._defaultPageLimit(),
      oThis._minPageLimit(),
      oThis._maxPageLimit()
    );

    if (!limitVas[0]) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_b_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_limit'],
          debug_options: {}
        })
      );
    }

    oThis.limit = limitVas[1];
  }

  /**
   * Fetch profile user.
   *
   * @returns {Promise<object>}
   * @private
   */
  async _fetchProfileUser() {
    const oThis = this;

    const UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User');
    const profileUserByIdResponse = await new UserMultiCache({ ids: [oThis.profileUserId] }).fetch();

    const profileUserObj = profileUserByIdResponse.data[oThis.profileUserId];

    if (profileUserByIdResponse.isFailure() || !CommonValidators.validateNonEmptyObject(profileUserObj)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_b_3',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            reason: 'Invalid userId',
            profileUserId: oThis.profileUserId,
            currentUserId: oThis.currentUserId
          }
        })
      );
    }

    return profileUserObj;
  }

  /**
   * Validate whether profile userId is correct or not.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _validateProfileUserId() {
    const oThis = this;

    const profileUserObj = await oThis._fetchProfileUser();

    if (profileUserObj.status === userConstants.inActiveStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_b_4',
          api_error_identifier: 'entity_not_found',
          debug_options: {}
        })
      );
    }

    return responseHelper.successWithData({ userObject: profileUserObj });
  }

  /**
   * Validate whether profile userId is correct or not. Inactive users are also valid.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _validateInactiveProfileUserId() {
    const oThis = this;

    const profileUserObj = await oThis._fetchProfileUser();

    return responseHelper.successWithData({ userObject: profileUserObj });
  }

  _currentPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  _defaultPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  _minPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  _maxPageLimit() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Async perform.
   *
   * @private
   * @returns {Promise<void>}
   */
  async _asyncPerform() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = ServicesBase;

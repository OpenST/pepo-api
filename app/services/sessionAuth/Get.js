const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  SessionAuthPayloadCache = require(rootPrefix + '/lib/cacheManagement/multi/SessionAuthPayload'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  sessionAuthPayloadConstants = require(rootPrefix + '/lib/globalConstant/big/sessionAuthPayload');

/**
 * Class to get session auth.
 *
 * @class GetSessionAuth
 */
class GetSessionAuth extends ServiceBase {
  /**
   * Constructor to get user profile.
   *
   * @param {object} params
   * @param {string/number} params.session_auth_payload_id
   * @param {object} params.current_user
   * @param {string/number} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.sessionAuthPayloadId = +params.session_auth_payload_id;
    oThis.currentUserId = +params.current_user.id;

    oThis.sessionAuthPayloadObj = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchSessionAuthPayload();

    return responseHelper.successWithData({
      [entityTypeConstants.sessionAuthPayload]: oThis.sessionAuthPayloadObj
    });
  }

  /**
   * Fetch session auth payload.
   *
   * @sets oThis.sessionAuthPayloadObj
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchSessionAuthPayload() {
    const oThis = this;

    const cacheRsp = await new SessionAuthPayloadCache({ ids: [oThis.sessionAuthPayloadId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.sessionAuthPayloadObj = cacheRsp.data[oThis.sessionAuthPayloadId];

    if (!CommonValidators.validateNonEmptyObject(oThis.sessionAuthPayloadObj)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_sa_g_fsap_1',
          api_error_identifier: 'entity_not_found',
          debug_options: { sessionAuthPayloadId: oThis.sessionAuthPayloadId }
        })
      );
    }

    if (
      !oThis.sessionAuthPayloadObj.id ||
      oThis.sessionAuthPayloadObj.status !== sessionAuthPayloadConstants.activeStatus ||
      oThis.sessionAuthPayloadObj.userId != oThis.currentUserId
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_sa_g_fsap_2',
          api_error_identifier: 'entity_not_found',
          debug_options: { sessionAuthPayloadObj: oThis.sessionAuthPayloadObj }
        })
      );
    }
  }
}

module.exports = GetSessionAuth;

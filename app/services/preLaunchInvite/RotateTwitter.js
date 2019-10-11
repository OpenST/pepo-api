const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class to rotate twitter account.
 *
 * @class RotateTwitterAccount
 */
class RotateTwitterAccount extends ServiceBase {
  /**
   * Constructor to rotate twitter account.
   *
   * @param {object} params
   * @param {string} params.twitter_handle: twitter handle
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.twitterHandle = params.twitter_handle;

    oThis.preLaunchInviteObj = null;
    oThis.preLaunchInviteId = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchPreLaunchInvite();

    await oThis._rotateTwitterAccount();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch twitter user object if present.
   *
   * @sets oThis.preLaunchInviteObj, oThis.preLaunchInviteId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPreLaunchInvite() {
    const oThis = this;

    const fetchData = await new PreLaunchInviteModel()
      .select('*')
      .where({ handle: oThis.twitterHandle })
      .fire();

    oThis.preLaunchInviteObj = new PreLaunchInviteModel().formatDbData(fetchData[0] || {}) || {};

    if (!oThis.preLaunchInviteObj.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_pli_rta_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_found'],
          debug_options: { twitterHandle: oThis.twitterHandle }
        })
      );
    }

    oThis.preLaunchInviteId = oThis.preLaunchInviteObj.id;

    if (basicHelper.isTwitterIdRotated(oThis.preLaunchInviteObj.twitterId)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_pli_rta_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_twitter_user'],
          debug_options: {
            preLaunchInviteId: oThis.preLaunchInviteId,
            twitterId: oThis.preLaunchInviteObj.twitterId
          }
        })
      );
    }

    logger.log('End::Fetch PreLaunchInvite');
  }

  /**
   * Rotate twitter account.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _rotateTwitterAccount() {
    const oThis = this;

    const rotatedTwitterHandle = oThis.twitterHandle + oThis.preLaunchInviteId.toString();
    const negatedTwitterId = '-' + oThis.preLaunchInviteId.toString();

    await new PreLaunchInviteModel()
      .update({ twitter_id: negatedTwitterId, handle: rotatedTwitterHandle })
      .where({ id: oThis.preLaunchInviteId })
      .fire();

    return PreLaunchInviteModel.flushCache(oThis.preLaunchInviteObj);
  }
}

module.exports = RotateTwitterAccount;

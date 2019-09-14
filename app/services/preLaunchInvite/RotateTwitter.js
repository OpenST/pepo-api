const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite');

class RotateTwitterAccount extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   * @param params.twitter_handle {string} - twitter handle
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.twitterHandle = params.twitter_handle;

    oThis.preLaunchInviteObj = null;
    oThis.preLaunchInviteId = null;
    oThis.preLaunchInviteTwitterId = null;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchPreLaunchInvite();

    await oThis._rotateTwitterAccount();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch Twitter User Obj if present.
   *
   * @sets oThis.preLaunchInviteId
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchPreLaunchInvite() {
    const oThis = this;

    let fetchData = await new PreLaunchInviteModel()
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
          debug_options: { twitterId: oThis.twitterId }
        })
      );
    }

    oThis.preLaunchInviteId = oThis.preLaunchInviteObj.id;

    if (oThis.preLaunchInviteObj.twitterId) {
      oThis.preLaunchInviteTwitterId = oThis.preLaunchInviteObj.twitterId;
    }

    logger.log('End::Fetch PreLaunchInvite');
    return responseHelper.successWithData({});
  }

  /**
   * Rotate twitter account
   *
   * @returns {Promise<void>}
   * @private
   */
  async _rotateTwitterAccount() {
    const oThis = this;
    if (oThis.preLaunchInviteId === oThis.twitterId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_pli_rta_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_twitter_user'],
          debug_options: {
            preLaunchInviteId: oThis.preLaunchInviteId,
            twitterId: oThis.twitterId
          }
        })
      );
    }

    let rotatedTwitterHandle = oThis.twitterHandle + oThis.preLaunchInviteId.toString();

    await new PreLaunchInviteModel()
      .update({ twitter_id: oThis.preLaunchInviteId, handle: rotatedTwitterHandle })
      .where({ id: oThis.preLaunchInviteId })
      .fire();

    await PreLaunchInviteModel.flushCache(oThis.preLaunchInviteObj);
  }
}

module.exports = RotateTwitterAccount;

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class ValidateSupportUrl extends ServiceBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUser = params.current_user;
  }

  /**
   * async perform
   *
   * @return {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    return Promise.resolve(
      responseHelper.successWithData({
        userId: oThis.currentUser.id,
        external_user_id: oThis.currentUser.externalUserId,
        user_name: oThis.currentUser.name
      })
    );
  }
}

module.exports = ValidateSupportUrl;

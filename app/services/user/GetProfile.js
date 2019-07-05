const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get');

/**
 * Class for user profile get
 *
 * @class
 */
class GetUserProfile extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.userId;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    return oThis._fetchProfileDetails();
  }

  /**
   * Fetch profile details
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileDetails() {
    const oThis = this;

    let getProfileObj = new GetProfile({ userId: oThis.userId });

    let response = await getProfileObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    return response;
  }
}

module.exports = GetUserProfile;

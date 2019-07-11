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
   * @param params.userId {String} - user id
   * @param params.currentUser {object} - current_user
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = +params.user_id;
    oThis.currentUserId = +params.current_user.id;
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

    let getProfileObj = new GetProfile({ userId: oThis.userId, currentUserId: oThis.currentUserId });

    let response = await getProfileObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    return response;
  }
}

module.exports = GetUserProfile;

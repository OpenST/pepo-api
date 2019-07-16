const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class PublicVideoFeed extends ServiceBase {
  constructor() {
    const oThis = this;

    oThis.feeds = [];
    oThis.users = {};
    oThis.userIds = [];
    oThis.videoIds = [];
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();
    await oThis._getFeeds();
    await oThis._getUsers();
  }

  async _validateAndSanitizeParams() {
    return responseHelper.successWithData({});
  }

  async _getFeeds() {
    const oThis = this;

    oThis.feeds = [
      {
        id: '1',
        kind: 'FAN_UPDATE',
        payload: {
          video_id: '123',
          user_id: '1000'
        }
      },
      {
        id: '2',
        kind: 'FAN_UPDATE',
        payload: {
          video_id: '124',
          user_id: '1001'
        }
      },
      {
        id: '3',
        kind: 'FAN_UPDATE',
        payload: {
          video_id: '125',
          user_id: '1002'
        }
      }
    ];

    oThis.userIds = [1000, 1001, 1002];
    oThis.videoIds = [123, 124, 125];
  }

  /**
   * Fetch profile details
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileDetails() {
    const oThis = this;

    let getProfileObj = new GetProfile({
      userIds: oThis.userIds,
      currentUserId: oThis.currentUserId,
      videoIds: oThis.videoIds
    });

    let response = await getProfileObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    return response;
  }
}

module.exports = PublicVideoFeed;

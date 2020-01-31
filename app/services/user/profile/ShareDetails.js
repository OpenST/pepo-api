const uuidV4 = require('uuid/v4');

const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  UserByUsernameCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  shareEntityConstants = require(rootPrefix + '/lib/globalConstant/shareEntity'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class to create profile share details.
 *
 * @class ProfileShareDetails
 */
class ProfileShareDetails extends ServiceBase {
  /**
   * Constructor to create profile share details.
   *
   * @param {object} params
   * @param {string} params.username
   * @param {number} params.user_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.username = params.username || '';
    oThis.userId = params.user_id || null;

    oThis.name = null;
    oThis.profileImageUrl = null;
    oThis.twitterHandle = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUserDetails();

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch user details by username or user id
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUserDetails() {
    const oThis = this;

    // If user Id is not passed and username is passed.
    if (!oThis.userId) {
      const cacheResponse = await new UserByUsernameCache({ userNames: [oThis.username] }).fetch();
      if (cacheResponse.isFailure()) {
        return Promise.reject(cacheResponse);
      }

      if (!CommonValidators.validateNonEmptyObject(cacheResponse.data[oThis.username])) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_u_p_sd_1',
            api_error_identifier: 'entity_not_found',
            debug_options: {
              username: oThis.username
            }
          })
        );
      }

      oThis.userId = cacheResponse.data[oThis.username].id;
    }

    const userCacheResponse = await new UserCache({ ids: [oThis.userId] }).fetch(),
      userDetails = userCacheResponse.data[oThis.userId];

    if (!CommonValidators.validateNonEmptyObject(userDetails) || userDetails.status === userConstants.inactiveStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_sd_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            username: oThis.username,
            status: userDetails.status,
            id: userDetails.id
          }
        })
      );
    }

    oThis.name = userDetails.name;
    oThis.username = oThis.username || userDetails.userName;

    await Promise.all([oThis._fetchProfileImage(userDetails.profileImageId), oThis._fetchTwitterHandle(oThis.userId)]);
  }

  /**
   * Fetch twitter handle.
   *
   * @sets oThis.twitterHandle
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchTwitterHandle(userId) {
    const oThis = this;

    const twitterUserByUserIdsCacheResponse = await new TwitterUserByUserIdsCache({
      userIds: [userId]
    }).fetch();

    if (twitterUserByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResponse);
    }

    const twitterUserByUserIdsCacheData = twitterUserByUserIdsCacheResponse.data[userId];

    if (!twitterUserByUserIdsCacheData || !twitterUserByUserIdsCacheData.id) {
      return; // Don't set oThis.twitterHandle, this returns share entity without 'twitterHandle'
    }

    const twitterUserId = twitterUserByUserIdsCacheData.id;

    const twitterUserByUserIdCacheResponse = await new TwitterUserByIdsCache({ ids: [twitterUserId] }).fetch();
    if (twitterUserByUserIdCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdCacheResponse);
    }

    oThis.twitterHandle = twitterUserByUserIdCacheResponse.data[twitterUserId].handle;
  }

  /**
   * Fetch profile image of user
   *
   * @param imageId
   * @returns {Promise<never>}
   * @private
   */
  async _fetchProfileImage(imageId) {
    const oThis = this;

    if (!imageId) {
      return;
    }

    const imageCacheResponse = await new ImageByIdCache({ ids: [imageId] }).fetch();
    if (imageCacheResponse.isFailure()) {
      return Promise.reject(imageCacheResponse);
    }

    const imageObj = imageCacheResponse.data[imageId];
    if (CommonValidators.validateNonEmptyObject(imageObj)) {
      oThis.profileImageUrl = imageObj.resolutions.original.url;
    }
  }

  /**
   * Prepare final response.
   *
   * @returns {{}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const messageObject = shareEntityConstants.getProfileShareEntity({
      name: oThis.name,
      url: oThis._generateShareUrl(),
      twitterHandle: oThis.twitterHandle
    });

    return {
      [entityTypeConstants.share]: Object.assign(
        {
          id: uuidV4(),
          kind: shareEntityConstants.profileShareKind,
          posterImageUrl: oThis.profileImageUrl,
          uts: Math.round(new Date() / 1000)
        },
        messageObject
      )
    };
  }

  /**
   * Generate share url.
   *
   * @returns {string}
   * @private
   */
  _generateShareUrl() {
    const oThis = this;

    return (
      coreConstants.PA_DOMAIN +
      '/' +
      oThis.username +
      `?utm_source=share&utm_medium=profile&utm_campaign=${oThis.userId}`
    );
  }
}

module.exports = ProfileShareDetails;

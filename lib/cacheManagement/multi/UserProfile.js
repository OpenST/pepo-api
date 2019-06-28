const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  EntityPermalinkModel = require(rootPrefix + '/app/models/mysql/entityPermalink'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ProfileTextModel = require(rootPrefix + '/app/models/mysql/ProfileText'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserProfile extends CacheMultiBase {
  /**
   * @constructor
   *
   * @param params
   *
   * @param {array} params.userIds: userIds
   */
  constructor(params) {
    super(params);
  }

  /**
   * Init params in oThis
   *
   * @param params
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @returns {string}
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Set cache keys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_up_uid_' + oThis.userIds[ind]] = oThis.userIds[ind];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it
   */
  _setCacheExpiry() {
    const oThis = this;
    oThis.cacheExpiry = 3 * cacheManagementConst.largeExpiryTimeInterval; // 3 days
  }

  /**
   * Fetch data from source
   * @param {array} cacheMissIds - cache miss ids
   * @return {Result}
   */
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this,
      userIdProfileInfoMap = {};

    let userIdProfileElementsMap = await new UserProfileElementModel({}).fetchByUserIds(cacheMissIds);

    for (let userId in userIdProfileElementsMap) {
      let profileElements = userIdProfileElementsMap[userId];
      let profileInfo = {};

      for (let ind = 0; ind < profileElements.length; ind++) {
        let element = profileElements[ind];

        let profileElementDetail = await oThis._getElementKindDetails(element);

        Object.assign(profileInfo, profileElementDetail);
      }

      let userDetail = await oThis._getUserDetails(userId);

      Object.assign(profileInfo, userDetail);

      let userName = await oThis._getUserName(userId);
      profileInfo['userName'] = userName;

      userIdProfileInfoMap[userId] = profileInfo;
    }

    return responseHelper.successWithData(userIdProfileInfoMap);
  }

  /**
   * Get element details by kind
   *
   * @param {Object} profileElement - profileElement
   * @return {Promise<void>}
   * @private
   */
  async _getElementKindDetails(profileElement) {
    const oThis = this,
      dataKind = profileElement.dataKind,
      data = profileElement.data,
      elementDetails = {};

    let profileText = {};

    switch (dataKind) {
      case userProfileElementConst.profileImageKind:
        elementDetails[dataKind] = data;
        break;
      case userProfileElementConst.aboutMeKind:
      case userProfileElementConst.microReasonKind:
      case userProfileElementConst.goal:
        profileText = await new ProfileTextModel({}).fetchById(data);
        elementDetails[dataKind] = profileText.text;
        break;
      default:
        logger.error('Invalid user element data kind');
    }

    return elementDetails;
  }

  /**
   * Get user details
   *
   * @param userId
   * @return {Promise<never>}
   * @private
   */
  async _getUserDetails(userId) {
    const oThis = this;

    let userDetails = await new UserModel({}).fetchById(userId);

    return {
      firstName: userDetails.firstName,
      lastName: userDetails.lastName
    };
  }

  /**
   * Get user name
   *
   * @param userId
   * @return {Promise<*|string>}
   * @private
   */
  async _getUserName(userId) {
    const oThis = this;

    let permalinkDetails = await new EntityPermalinkModel({}).fetchByEntityId(userId);

    return permalinkDetails.permalink;
  }
}

module.exports = UserProfile;

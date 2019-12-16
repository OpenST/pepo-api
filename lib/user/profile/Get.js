const rootPrefix = '../../..',
  UserStatByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  UserContributorByUserIdsAndContributedByUserId = require(rootPrefix +
    '/lib/cacheManagement/multi/UserContributorByUserIdsAndContributedByUserId'),
  PendingTransactionsByToUserIdsAndFromUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/multi/PendingTransactionsByToUserIdsAndFromUserId'),
  UserMuteByUser1IdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserMuteByUser1Ids'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  TwitterUserByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByIds'),
  TwitterUserByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByUserIds'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class GetUserProfile {
  /**
   * @constructor
   *
   * @param params
   * @param {array} params.userIds - Array of user ids
   * @param {object} params.currentUserId - current user id
   * @param {boolean} params.isAdmin - flag to determine if current user is an admin or not.
   * @param {array} params.videoIds - Array of video ids
   */
  constructor(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
    oThis.currentUserId = params.currentUserId;
    oThis.isAdmin = params.isAdmin || false;
    oThis.videoIdsArray = [];
    oThis.fetchAssociatedEntities = params.fetchAssociatedEntities || 1;

    oThis.activeUserIds = [];
    oThis.userProfilesMap = {};
    oThis.users = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.userProfileAllowedActions = {};
    oThis.images = {};
    oThis.links = {};
    oThis.tags = {};
    oThis.userStatMap = {};
    oThis.imageIdsArray = [];
    oThis.currentUserUserContributionsMap = {};
    oThis.pricePoints = {};
    oThis.allLinkIds = [];
    oThis.allTextIds = [];
    oThis.userRspForPendingTransaction = {};
    oThis.textIdToUserIdMap = {};
    oThis.twitterUsersMap = {};
    oThis.blockedByUserInfo = [];
    oThis.includesData = {};
    oThis.mutedUsersMap = {};
  }

  /**
   * Perform.
   *
   * @return {Promise<{}>}
   */
  async perform() {
    const oThis = this;

    // Fetch muted users by current user id.
    await oThis._fetchMuteUsers();

    let promisesArr = [oThis._fetchUsers(), oThis._fetchPricePoints()];
    await Promise.all(promisesArr);

    // If active users are present
    if (oThis.activeUserIds.length > 0) {
      await oThis._fetchProfileElements();

      let promiseArray = [];

      promiseArray.push(
        oThis._fetchUserStats(),
        oThis._fetchTokenUser(),
        oThis._fetchUserContributions(),
        oThis._fetchTwitterUsers(),
        oThis._fetchAssociatedEntities(),
        oThis._fetchPendingTransactions()
      );

      await Promise.all(promiseArray);

      oThis._processPendingTransactions();
    }

    const finalResponse = {
      userProfilesMap: oThis.userProfilesMap,
      userProfileAllowedActions: oThis.userProfileAllowedActions,
      usersByIdMap: oThis.users,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      imageMap: oThis.images,
      linkMap: oThis.links,
      tags: oThis.tags,
      userStat: oThis.userStatMap,
      currentUserUserContributionsMap: oThis.currentUserUserContributionsMap,
      pricePointsMap: oThis.pricePoints,
      twitterUsersMap: oThis.twitterUsersMap,
      currentUserBlockedList: oThis.blockedByUserInfo,
      linkIds: oThis.allLinkIds,
      textIds: oThis.allTextIds,
      imageIdsArray: oThis.imageIdsArray
    };

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Set user profile.
   *
   * @private
   */
  _setUserProfile() {
    const oThis = this;

    for (let i = 0; i < oThis.activeUserIds.length; i++) {
      let activeUserId = oThis.activeUserIds[i];

      oThis.userProfilesMap[activeUserId] = {
        id: activeUserId,
        userId: activeUserId,
        bio: null,
        linkIds: [],
        updatedAt: null
      };

      oThis._getUserProfileAllowedActions(activeUserId);
    }
  }

  /**
   * Get user profile allowed actions.
   *
   * @Sets oThis.userProfileAllowedActions
   *
   * @private
   */
  _getUserProfileAllowedActions(userId) {
    const oThis = this;

    oThis.userProfileAllowedActions[userId] = oThis.userProfileAllowedActions[userId] || {};
    if (userId === oThis.currentUserId) {
      oThis.userProfileAllowedActions[userId]['canEdit'] = 1;
      oThis.userProfileAllowedActions[userId]['canReport'] = 0;
      oThis.userProfileAllowedActions[userId]['canBlock'] = 0;
      oThis.userProfileAllowedActions[userId]['canUnblock'] = 0;
      oThis.userProfileAllowedActions[userId]['canMute'] = 0;
      oThis.userProfileAllowedActions[userId]['canUnmute'] = 0;
    } else {
      oThis.userProfileAllowedActions[userId]['canEdit'] = 0;
      oThis.userProfileAllowedActions[userId]['canReport'] = 1;

      if (oThis.currentUserId) {
        if (oThis.mutedUsersMap[userId]) {
          oThis.userProfileAllowedActions[userId]['canMute'] = 0;
          oThis.userProfileAllowedActions[userId]['canUnmute'] = 1;
        } else {
          oThis.userProfileAllowedActions[userId]['canMute'] = 1;
          oThis.userProfileAllowedActions[userId]['canUnmute'] = 0;
        }
      } else {
        oThis.userProfileAllowedActions[userId]['canMute'] = 0;
        oThis.userProfileAllowedActions[userId]['canUnmute'] = 0;
      }

      if (oThis.blockedByUserInfo.hasBlocked[userId]) {
        oThis.userProfileAllowedActions[userId]['canBlock'] = 0;
        oThis.userProfileAllowedActions[userId]['canUnblock'] = 1;
      } else {
        oThis.userProfileAllowedActions[userId]['canBlock'] = 1;
        oThis.userProfileAllowedActions[userId]['canUnblock'] = 0;
      }
    }
  }

  /**
   * Fetch user stats
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchUserStats() {
    const oThis = this;

    const userStatByUserIdsCacheObj = new UserStatByUserIdsCache({ userIds: oThis.activeUserIds }),
      cacheRsp = await userStatByUserIdsCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.userStatMap = cacheRsp.data;
  }

  /**
   * Fetch user.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    const cacheRsp = await new UserMultiCache({ ids: oThis.userIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.users = cacheRsp.data;

    let cacheResp = await new UserBlockedListCache({ userId: oThis.currentUserId }).fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    oThis.blockedByUserInfo = cacheResp.data[oThis.currentUserId];

    for (let i = 0; i < oThis.userIds.length; i++) {
      const userId = oThis.userIds[i],
        userObj = oThis.users[userId];

      // If user is not found or its inactive
      if (!oThis.forwardProfile(userObj)) {
        delete oThis.users[userId];
        continue;
      }
      oThis.activeUserIds.push(userId);
      let profileImageId = userObj.profileImageId;

      if (profileImageId) {
        oThis.imageIdsArray.push(profileImageId);
      }
    }

    oThis._setUserProfile();
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('Fetching token user.');

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: oThis.activeUserIds }).fetch();

    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUsersByUserIdMap = tokenUserRes.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch user contributions.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserContributions() {
    const oThis = this;

    const userContributorByUserIdsAndContributedByUserIdCacheRsp = await new UserContributorByUserIdsAndContributedByUserId(
      {
        contributedByUserId: oThis.currentUserId,
        userIds: oThis.activeUserIds
      }
    ).fetch();

    if (userContributorByUserIdsAndContributedByUserIdCacheRsp.isFailure()) {
      return Promise.reject(userContributorByUserIdsAndContributedByUserIdCacheRsp);
    }

    oThis.currentUserUserContributionsMap = userContributorByUserIdsAndContributedByUserIdCacheRsp.data;
  }

  /**
   * Fetch price points.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPricePoints() {
    const oThis = this;

    const pricePointsCacheRsp = await new PricePointsCache().fetch();

    if (pricePointsCacheRsp.isFailure()) {
      return Promise.reject(pricePointsCacheRsp);
    }

    oThis.pricePoints = pricePointsCacheRsp.data;
  }

  /**
   * Fetch Twitter User Obj if present.
   *
   * @sets oThis.twitterUsersMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchTwitterUsers() {
    const oThis = this;

    const twitterUserByUserIdsCacheResponse = await new TwitterUserByUserIdsCache({
      userIds: oThis.userIds
    }).fetch();

    if (twitterUserByUserIdsCacheResponse.isFailure()) {
      return Promise.reject(twitterUserByUserIdsCacheResponse);
    }

    let twitterUserIds = [];
    for (let userId in twitterUserByUserIdsCacheResponse.data) {
      if (twitterUserByUserIdsCacheResponse.data[userId].id) {
        twitterUserIds.push(twitterUserByUserIdsCacheResponse.data[userId].id);
      }
    }

    const twitterUserByIdsCacheResp = await new TwitterUserByIdsCache({
      ids: twitterUserIds
    }).fetch();

    if (twitterUserByIdsCacheResp.isFailure()) {
      return Promise.reject(twitterUserByIdsCacheResp);
    }

    for (let id in twitterUserByIdsCacheResp.data) {
      let twitterUser = twitterUserByIdsCacheResp.data[id];

      oThis.twitterUsersMap[twitterUser.userId] = twitterUser;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch profile elements.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElements() {
    const oThis = this;

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: oThis.activeUserIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    let profileElementsData = cacheRsp.data;

    for (let userId in profileElementsData) {
      let profileElements = profileElementsData[userId],
        updatedAt = 0;

      for (let kind in profileElements) {
        if (updatedAt < profileElements[kind].updatedAt) {
          updatedAt = profileElements[kind].updatedAt;
        }

        await oThis._fetchElementData(userId, oThis.users[userId], kind, profileElements[kind].data);
      }

      oThis.userProfilesMap[userId]['updatedAt'] = updatedAt;
    }
  }

  /**
   * Fetch element data.
   *
   * @param {number} userId - profile element userId
   * @param {Object} userObj - user object
   * @param {string} kind - profile element kind
   * @param {number} data - profile element data
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchElementData(userId, userObj, kind, data) {
    const oThis = this;

    switch (kind) {
      case userProfileElementConst.bioIdKind: {
        oThis.allTextIds.push(data);
        oThis.textIdToUserIdMap[data] = userId;
        oThis.userProfilesMap[userId].bioId = data;

        return;
      }
      case userProfileElementConst.linkIdKind: {
        oThis.allLinkIds.push(data);
        oThis.userProfilesMap[userId].linkIds.push(data);

        return;
      }
      case userProfileElementConst.locationIdKind:
      case userProfileElementConst.lifetimePurchaseLimitKind: {
        return;
      }

      default:
        logger.log('Invalid profile element kind.');
    }
  }

  /**
   * Fetch all associated entities
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAssociatedEntities() {
    const oThis = this;

    if (!oThis.fetchAssociatedEntities) {
      return;
    }

    const associatedEntitiesResp = await new FetchAssociatedEntities({
      textIds: oThis.allTextIds,
      linkIds: oThis.allLinkIds,
      imageIds: oThis.imageIdsArray
    }).perform();

    oThis.links = associatedEntitiesResp.data.links;
    oThis.tags = associatedEntitiesResp.data.tags;
    oThis.images = associatedEntitiesResp.data.imagesMap;
    const textMap = associatedEntitiesResp.data.textMap;

    for (let textId in textMap) {
      const userId = oThis.textIdToUserIdMap[textId];
      if (userId && textMap[textId]) {
        oThis.userProfilesMap[userId]['bio'] = textMap[textId];
      }
    }
  }

  /**
   * Fetch pending transactions
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchPendingTransactions() {
    const oThis = this;

    if (oThis.isAdmin) {
      return;
    }

    let index = oThis.activeUserIds.indexOf(oThis.currentUserId);
    let userIdsToCheck = oThis.activeUserIds;
    userIdsToCheck.splice(index, index);

    if (userIdsToCheck.length > 0) {
      let PendingTransactionsByToUserIdsAndFromUserIdCacheRsp = await new PendingTransactionsByToUserIdsAndFromUserIdCache(
        { fromUserId: oThis.currentUserId, toUserIds: userIdsToCheck }
      ).fetch();

      if (PendingTransactionsByToUserIdsAndFromUserIdCacheRsp.isFailure()) {
        return Promise.reject(PendingTransactionsByToUserIdsAndFromUserIdCacheRsp);
      }

      let pendingTransactionsByToUserIds = PendingTransactionsByToUserIdsAndFromUserIdCacheRsp.data;

      let pendingTransactionForUserEntity = {
        totalAmount: 0,
        totalTransaction: 0,
        uts: 0
      };

      for (let toUserId in pendingTransactionsByToUserIds) {
        let pendingTransactionsByToUserIdArray = pendingTransactionsByToUserIds[toUserId];
        if (pendingTransactionsByToUserIdArray.length > 0) {
          oThis.userRspForPendingTransaction[toUserId] = { ...pendingTransactionForUserEntity };

          for (let index = 0; index < pendingTransactionsByToUserIdArray.length; index++) {
            let userEntity = pendingTransactionsByToUserIdArray[index];
            oThis.userRspForPendingTransaction[toUserId].totalAmount = basicHelper.convertToBigNumberAndAdd(
              oThis.userRspForPendingTransaction[toUserId].totalAmount,
              userEntity.amount
            );
            oThis.userRspForPendingTransaction[toUserId].totalTransaction += 1;
            if (oThis.userRspForPendingTransaction[toUserId].uts < userEntity.updatedAt) {
              oThis.userRspForPendingTransaction[toUserId].uts = userEntity.updatedAt;
            }
          }
        }
      }
    }
  }

  /**
   * Fetch users, muted by current user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchMuteUsers() {
    const oThis = this;

    if (!oThis.currentUserId) {
      return;
    }

    const userMuteByUser1IdsCacheResp = await new UserMuteByUser1IdsCache({ user1Ids: [oThis.currentUserId] }).fetch();

    if (userMuteByUser1IdsCacheResp.isFailure()) {
      return Promise.reject(userMuteByUser1IdsCacheResp);
    }

    const userMuteByUser1IdsCacheRespData = userMuteByUser1IdsCacheResp.data;

    oThis.mutedUsersMap = userMuteByUser1IdsCacheRespData[oThis.currentUserId];
  }

  /**
   * Process Pending Transactions
   *
   * @private
   */
  _processPendingTransactions() {
    const oThis = this;

    oThis._updateUserStats();
    oThis._updateCurrentUserUserContributions();
  }

  /**
   * Update user stats
   *
   * @private
   */
  _updateUserStats() {
    const oThis = this;
    for (let userId in oThis.userRspForPendingTransaction) {
      if (oThis.userStatMap[userId] && CommonValidators.validateNonEmptyObject(oThis.userStatMap[userId])) {
        oThis.userStatMap[userId].totalAmountRaised = basicHelper.convertToBigNumberAndAdd(
          oThis.userStatMap[userId].totalAmountRaised,
          oThis.userRspForPendingTransaction[userId].totalAmount
        );
        if (oThis.userStatMap[userId].updatedAt < oThis.userRspForPendingTransaction[userId].uts) {
          oThis.userStatMap[userId].updatedAt = oThis.userRspForPendingTransaction[userId].uts;
        }
        if (!CommonValidators.validateNonEmptyObject(oThis.currentUserUserContributionsMap[userId])) {
          oThis.userStatMap[userId].totalContributedBy += 1;
        }
      } else {
        oThis.userStatMap[userId].id = -1;
        oThis.userStatMap[userId].userId = userId;
        oThis.userStatMap[userId].totalContributedBy = 1;
        oThis.userStatMap[userId].totalContributedTo = 0;
        oThis.userStatMap[userId].totalAmountSpent = 0;
        oThis.userStatMap[userId].totalAmountRaised = oThis.userRspForPendingTransaction[userId].totalAmount;
        oThis.userStatMap[userId].createdAt = oThis.userRspForPendingTransaction[userId].uts;
        oThis.userStatMap[userId].updatedAt = oThis.userRspForPendingTransaction[userId].uts;
      }
    }
  }

  /**
   * Update current user user contributions
   *
   * @private
   */
  _updateCurrentUserUserContributions() {
    const oThis = this;
    for (let userId in oThis.userRspForPendingTransaction) {
      // if there is entry in pending transactions then only proceed further
      if (oThis.currentUserUserContributionsMap[userId]) {
        if (CommonValidators.validateNonEmptyObject(oThis.currentUserUserContributionsMap[userId])) {
          oThis.currentUserUserContributionsMap[userId].totalAmount = basicHelper.convertToBigNumberAndAdd(
            oThis.currentUserUserContributionsMap[userId].totalAmount,
            oThis.userRspForPendingTransaction[userId].totalAmount
          );
          oThis.currentUserUserContributionsMap[userId].totalTransactions +=
            oThis.userRspForPendingTransaction[userId].totalTransaction;

          if (
            oThis.currentUserUserContributionsMap[userId].updatedAt < oThis.userRspForPendingTransaction[userId].uts
          ) {
            oThis.currentUserUserContributionsMap[userId].updatedAt = oThis.userRspForPendingTransaction[userId].uts;
          }
        } else {
          oThis.currentUserUserContributionsMap[userId].id = -1;
          oThis.currentUserUserContributionsMap[userId].userId = userId;
          oThis.currentUserUserContributionsMap[userId].contributedByUserId = oThis.currentUserId;
          oThis.currentUserUserContributionsMap[userId].totalAmount = oThis.userRspForPendingTransaction[
            userId
          ].totalAmount.toString();
          oThis.currentUserUserContributionsMap[userId].totalTransactions =
            oThis.userRspForPendingTransaction[userId].totalTransaction;
          oThis.currentUserUserContributionsMap[userId].createdAt = oThis.userRspForPendingTransaction[userId].uts;
          oThis.currentUserUserContributionsMap[userId].updatedAt = oThis.userRspForPendingTransaction[userId].uts;
        }
      }
    }
  }

  /**
   * Forward profile or not.
   *
   * @param {object} userObj
   *
   * @returns {boolean}
   */
  forwardProfile(userObj) {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(userObj)) {
      return false;
    }

    if (oThis.isAdmin) {
      return true;
    }

    return userObj.status !== userConstants.inActiveStatus;
  }
}

module.exports = GetUserProfile;

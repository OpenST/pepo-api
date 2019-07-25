/**
 * This module helps in adding or updating user social link
 *
 * @module lib/user/profile/AddUpdateLink
 */

const rootPrefix = '../../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement');

class AddUpdateLink {
  /**
   * @constructor
   *
   * @param params
   * @param {string} params.url - url to insert
   * @param {number} params.userId - user id
   * @param {Object} params.profileElementObj - Profile element object, Optional
   */
  constructor(params) {
    const oThis = this;

    oThis.url = params.url;
    oThis.userId = params.userId;
    oThis.profileElementObj = params.profileElementObj;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    // If profile element is passed then don't fetch again
    if (!oThis.profileElementObj) {
      await oThis._fetchProfileElement();
    }

    let insertRsp = null;
    if (oThis.url) {
      insertRsp = await new UrlModel({}).insertUrl({
        url: oThis.url,
        kind: urlConstants.socialUrlKind
      });
    }

    if (CommonValidator.validateObject(oThis.profileElementObj)) {
      if (insertRsp) {
        await new UserProfileElementModel()
          .update({
            data: insertRsp.insertId
          })
          .where({ id: oThis.profileElementObj.id })
          .fire();
      } else {
        await new UserProfileElementModel().deleteById({ id: oThis.profileElementObj.id });
      }

      // Delete old url
      await new UrlModel({}).deleteById({
        id: oThis.profileElementObj.data
      });
    } else {
      if (insertRsp) {
        await new UserProfileElementModel()
          .insert({
            user_id: oThis.userId,
            data_kind: userProfileElementConst.invertedKinds[userProfileElementConst.linkIdKind],
            data: insertRsp.insertId
          })
          .fire();
      }
    }

    await oThis._flushProfileCache();
  }

  /**
   * Fetch profile elements.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchProfileElement() {
    const oThis = this;

    const userProfileElementsByUserIdCacheObj = new UserProfileElementsByUserIdCache({ usersIds: [oThis.userId] }),
      cacheRsp = await userProfileElementsByUserIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return;
    }

    let profileElements = cacheRsp.data[oThis.userId];
    oThis.profileElementObj = profileElements[userProfileElementConst.linkIdKind];
  }

  /**
   * Flush cache
   *
   * @private
   */
  _flushProfileCache() {
    const oThis = this;

    return new UserProfileElementsByUserIdCache({ usersIds: [oThis.userId] }).clear();
  }
}

module.exports = AddUpdateLink;

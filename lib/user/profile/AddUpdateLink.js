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
   * @param {Boolean} params.flushCache
   */
  constructor(params) {
    const oThis = this;

    oThis.url = params.url;
    oThis.userId = params.userId;
    oThis.profileElementObj = params.profileElementObj;
    oThis.flushCache = CommonValidator.isVarNull(params.flushCache) ? 1 : params.flushCache;
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

    let urlId = null;
    // If user has added url before then only update urls table
    if (CommonValidator.validateObject(oThis.profileElementObj)) {
      urlId = oThis.profileElementObj.data;
      if (oThis.url) {
        // If new url is added then update in urls
        await new UrlModel({}).updateById({
          id: oThis.profileElementObj.data,
          url: oThis.url
        });
      } else {
        // If new url is not added, then delete old ones
        await new UserProfileElementModel().deleteById({ id: oThis.profileElementObj.id });
        // Delete old url
        await new UrlModel().deleteByIds({
          ids: [oThis.profileElementObj.data]
        });
      }
    } else {
      if (oThis.url) {
        // If new url is added then insert in 2 tables
        let insertRsp = await new UrlModel({}).insertUrl({
          url: oThis.url,
          kind: urlConstants.socialUrlKind
        });
        if (insertRsp) {
          urlId = insertRsp.insertId;
          await new UserProfileElementModel()
            .insert({
              user_id: oThis.userId,
              data_kind: userProfileElementConst.invertedKinds[userProfileElementConst.linkIdKind],
              data: insertRsp.insertId
            })
            .fire();
        }
      }
    }

    await oThis._flushCache();
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

    const profileElements = cacheRsp.data[oThis.userId];
    oThis.profileElementObj = profileElements[userProfileElementConst.linkIdKind];
  }

  /**
   * Flush cache
   *
   * @private
   */
  async _flushCache() {
    const oThis = this;

    if (oThis.flushCache) {
      await new UserProfileElementsByUserIdCache({ usersIds: [oThis.userId] }).clear();
    }
  }
}

module.exports = AddUpdateLink;

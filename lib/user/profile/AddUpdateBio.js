/**
 * This module helps in adding or updating user bio
 *
 * @module lib/user/profile/AddUpdateBio.js
 */

const rootPrefix = '../../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement');

class AddUpdateBio {
  /**
   * @constructor
   *
   * @param params
   * @param {string} params.bio - bio to insert
   * @param {number} params.userId - user id
   * @param {Object} params.profileElementObj - Profile element object, Optional
   */
  constructor(params) {
    const oThis = this;

    oThis.bio = params.bio;
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

    // Filter out tags from bio
    let resp = await new FilterTags(oThis.bio).perform(),
      bioData = resp.data;

    //
    if (!oThis.profileElementObj) {
      await oThis._fetchProfileElement();
    }

    // Insert text in texts table
    let textRow = null;
    if (oThis.bio) {
      textRow = await new TextModel().insertText({ text: bioData.text, tagIds: bioData.tagIds });
    }

    if (CommonValidator.validateObject(oThis.profileElementObj)) {
      if (textRow) {
        await new UserProfileElementModel()
          .update({
            data: textRow.insertId
          })
          .where({ id: oThis.profileElementObj.id })
          .fire();
      } else {
        await new UserProfileElementModel().deleteById({ id: oThis.profileElementObj.id });
      }

      // Delete old text
      await new TextModel({}).deleteById({
        id: oThis.profileElementObj.data
      });
    } else {
      if (textRow) {
        await new UserProfileElementModel()
          .insert({
            user_id: oThis.userId,
            data_kind: userProfileElementConst.invertedKinds[userProfileElementConst.bioIdKind],
            data: textRow.insertId
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
    oThis.profileElementObj = profileElements[userProfileElementConst.bioIdKind];
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

module.exports = AddUpdateBio;

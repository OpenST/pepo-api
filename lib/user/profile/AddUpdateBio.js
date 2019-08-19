/**
 * This module helps in adding or updating user bio
 *
 * @module lib/user/profile/AddUpdateBio
 */

const rootPrefix = '../../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  TextCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
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
   * @param {Boolean} params.flushCache
   */
  constructor(params) {
    const oThis = this;

    oThis.bio = params.bio;
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

    // Filter out tags from bio.
    let resp = await new FilterTags(oThis.bio).perform(),
      bioData = resp.data;

    if (!oThis.profileElementObj) {
      await oThis._fetchProfileElement();
    }

    let textId = null;

    // If user has added bio before then only update text.
    if (CommonValidator.validateObject(oThis.profileElementObj)) {
      textId = oThis.profileElementObj.data;
      if (oThis.bio) {
        // If new bio is added then update in text.
        await new TextModel({}).updateById({
          id: oThis.profileElementObj.data,
          text: bioData.text,
          tagIds: bioData.tagIds
        });
      } else {
        // If new bio is not added, then delete old ones.
        await new UserProfileElementModel().deleteById({ id: oThis.profileElementObj.id });
        // Delete old text
        await new TextModel({}).deleteById({
          id: oThis.profileElementObj.data
        });
      }
    } else {
      if (oThis.bio) {
        // If new bio is added then insert in 2 tables.
        let textRow = await new TextModel().insertText({ text: bioData.text, tagIds: bioData.tagIds });
        if (textRow) {
          textId = textRow.insertId;
          await new UserProfileElementModel()
            .insert({
              user_id: oThis.userId,
              data_kind: userProfileElementConst.invertedKinds[userProfileElementConst.bioIdKind],
              data: textRow.insertId
            })
            .fire();
        }
      }
    }

    await oThis._flushCache(textId);

    return resp;
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
  async _flushCache(textId) {
    const oThis = this;

    if (textId) {
      await new TextCacheKlass({ ids: [textId] }).clear();
    }

    if (oThis.flushCache) {
      await new UserProfileElementsByUserIdCache({ usersIds: [oThis.userId] }).clear();
    }
  }
}

module.exports = AddUpdateBio;

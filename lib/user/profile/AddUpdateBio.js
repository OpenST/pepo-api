/**
 * This module helps in adding or updating user bio
 *
 * @module lib/user/profile/AddUpdateBio
 */

const rootPrefix = '../../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

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

    let textId = null;

    if (!oThis.profileElementObj) {
      await oThis._fetchProfileElement();
    }

    // If user has added bio before then only update text.
    if (CommonValidator.validateObject(oThis.profileElementObj)) {
      textId = oThis.profileElementObj.data;
      if (oThis.bio) {
        // If new bio is added then update in text.
        await new TextModel({}).updateById({
          id: oThis.profileElementObj.data,
          text: oThis.bio
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
        const textRow = await new TextModel().insertText({
          text: oThis.bio,
          kind: textConstants.bioKind
        });
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

    let resp = {};

    if (oThis.bio) {
      // Filter out tags from bio.
      resp = await new FilterTags(oThis.bio, textId).perform();

      await oThis._flushCache(textId);
    }

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

    const profileElements = cacheRsp.data[oThis.userId];
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
      await TextModel.flushCache({ textIds: [textId] });
    }

    if (oThis.flushCache) {
      await new UserProfileElementsByUserIdCache({ usersIds: [oThis.userId] }).clear();
    }
  }
}

module.exports = AddUpdateBio;

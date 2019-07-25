/**
 * Module to associate tags to user profile, and manage their weights
 *
 * @module /lib/user/profile/AssociateTags
 */
const rootPrefix = '../../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  UserTagModel = require(rootPrefix + '/app/models/mysql/UserTag'),
  userTagConstants = require(rootPrefix + '/lib/globalConstant/userTag'),
  UserTagsCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/UserTagsByUserIds');

/**
 * Class to Associate tags to user profile
 *
 */
class AssociateTags {
  /**
   * Constructor to Associate tags to user profile.
   *
   * @param params
   * @param {number} params.userId
   * @param {Array} params.tagIds
   * @param {string} params.tagAddedKind
   *
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.tagIds = params.tagIds;
    oThis.kind = params.tagAddedKind;
    oThis.associatedTags = [];
    oThis.newTags = [];
    oThis.tagsRemoved = [];
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchUserTags();

    await oThis._associateTagsToUser();

    await oThis._manageTagWeightage();

    await new UserTagsCacheKlass({ userIds: [oThis.userId] }).clear();
  }

  /**
   * Fetch user tags
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserTags() {
    const oThis = this;

    let cacheResp = await new UserTagsCacheKlass({ userIds: [oThis.userId] }).fetch();

    oThis.associatedTags = cacheResp.data[oThis.userId][oThis.kind] || [];
  }

  /**
   * Associate tags to user
   *
   * @returns {Promise<void>}
   * @private
   */
  async _associateTagsToUser() {
    const oThis = this;

    let bulkInsertVal = [],
      insertKind = userTagConstants.invertedKinds[oThis.kind];

    oThis.newTags = oThis.tagIds.filter(function(val) {
      return oThis.associatedTags.indexOf(val) < 0;
    });

    for (let i = 0; i < oThis.newTags.length; i++) {
      bulkInsertVal.push([oThis.userId, oThis.newTags[i], insertKind]);
    }

    if (oThis.newTags.length > 0) {
      await new UserTagModel()
        .insertMultiple(['user_id', 'tag_id', 'kind'], bulkInsertVal)
        .onDuplicate({ kind: insertKind })
        .fire();
    }

    oThis.tagsRemoved = oThis.associatedTags.filter(function(val) {
      return oThis.tagIds.indexOf(val) < 0;
    });

    // If associated tags are present and insert kind is self added then delete old associated tags
    if (oThis.kind == userTagConstants.selfAddedKind && oThis.tagsRemoved.length > 0) {
      // Delete tags which are no longer added by user.
      await new UserTagModel()
        .delete()
        .where(['user_id = ? AND tag_id IN (?)', oThis.userId, oThis.tagsRemoved])
        .fire();
    }
  }

  /**
   * Manage weightage of tags
   *
   * @returns {Promise<void>}
   * @private
   */
  async _manageTagWeightage() {
    const oThis = this;

    // Manage tag weights only if kind is self added by user, derived tags would not increase tag weightage
    if (oThis.kind == userTagConstants.selfAddedKind) {
      if (oThis.tagsRemoved.length > 0) {
        await new TagModel().updateTagWeights(oThis.tagsRemoved, -1);
      }

      if (oThis.newTags.length > 0) {
        await new TagModel().updateTagWeights(oThis.newTags, 1);
      }
    }
  }
}

module.exports = AssociateTags;

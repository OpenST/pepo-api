const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  FilterAtMentions = require(rootPrefix + '/lib/FilterAtMentions'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  TextIncludeModel = require(rootPrefix + '/app/models/cassandra/TextInclude'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Base class to edit video/reply description.
 *
 * @class EditDescriptionBase
 */
class EditDescriptionBase {
  /**
   * Constructor to edit video/reply description.
   *
   * @param {object} params
   * @param {array} params.videoDescription: Video description of video by admin.
   * @param {array} params.videoId: Video id to edited.
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.videoId = params.videoId;
    oThis.videoDescription = params.videoDescription;

    oThis.videoDetail = null;
    oThis.creatorUserId = null;

    oThis.user = null;
    oThis.isUserCreator = null;

    oThis.text = null;
    oThis.textId = null;
    oThis.mentionedUserIds = [];
    oThis.oldTagsIds = [];
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async perform() {
    const oThis = this;
    // TODO: If existing video description is same as that of new one, dont add or delete.

    await oThis._fetchDetails();

    await oThis._fetchCreatorUser();

    await oThis._updateVideoDescription();

    await oThis._flushCache();

    await oThis._modifyTagAndRelatedEntities();

    await oThis._filterAtMentions();

    return responseHelper.successWithData({
      creatorUserId: oThis.creatorUserId,
      mentionedUserIds: oThis.mentionedUserIds
    });
  }

  /**
   * Fetch details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchDetails() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Fetch the user details and performs validations on the user status.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCreatorUser() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Decrement video tags weight and remove video tags for existing video description.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _decrementVideoTagsWeightForExistingDescription() {
    const oThis = this;

    const queryRsp = await new VideoTagModel()
      .select('*')
      .where(['video_id = ?', oThis.videoId])
      .fire();

    if (queryRsp.length === 0) {
      return;
    }

    const tagIdsArray = [];
    for (let index = 0; index < queryRsp.length; index++) {
      tagIdsArray.push(queryRsp[index].tag_id);
    }

    if (tagIdsArray.length === 0) {
      return;
    }

    oThis.oldTagsIds = tagIdsArray;

    return new DecrementWeightsAndRemoveVideoTags({
      tagIds: tagIdsArray,
      videoId: oThis.videoId,
      kind: oThis._videoKind()
    }).perform();
  }

  /**
   * Get video tag kind.
   *
   * @private
   */
  _videoKind() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Filter tags.
   *
   * @sets oThis.text, oThis.tagIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterTags() {
    const oThis = this;

    // Filter out tags from video description.
    const filterTagsResp = await new FilterTags(oThis.videoDescription, oThis.textId).perform(),
      videoDescriptionTagsData = filterTagsResp.data;

    oThis.text = videoDescriptionTagsData.text;
    oThis.tagIds = videoDescriptionTagsData.tagIds;
  }

  /**
   * Filter at mentions.
   *
   * @sets oThis.mentionedUserIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterAtMentions() {
    const oThis = this;

    // Filter out at mentions from video description.
    const filterAtMentionsResp = await new FilterAtMentions({
        text: oThis.videoDescription,
        textId: oThis.textId
      }).perform(),
      videoDescriptionAtMentionsData = filterAtMentionsResp.data;

    oThis.mentionedUserIds = videoDescriptionAtMentionsData.mentionedUserIds;
  }

  /**
   * Increment weights of new tags and add video tags.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _incrementWeightsAndAddVideoTags() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Modify tag and related entities.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _modifyTagAndRelatedEntities() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Update video description.
   *
   * @sets oThis.textId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoDescription() {
    const oThis = this;

    if (CommonValidators.validateNonBlankString(oThis.videoDescription)) {
      // If textId already exists, we need to update the text model.
      if (oThis.textId) {
        const updateParams = {
          id: oThis.textId,
          text: oThis.videoDescription
        };

        await new TextModel().updateById(updateParams);

        return TextModel.flushCache({ ids: [oThis.textId] });
        // Return here so there is no update in video detail.
      }

      const insertParams = {
        text: oThis.videoDescription,
        kind: textConstants.videoDescriptionKind
      };

      // Create new entry in texts table.
      const textRow = await new TextModel().insertText(insertParams);

      oThis.textId = textRow.insertId;
      await oThis._updateDetailsModel(oThis.textId, oThis.videoId);
    } else if (oThis.textId) {
      await new TextModel().deleteById({ id: oThis.textId });

      const cacheRsp = await new TextIncludesByIdsCache({ ids: [oThis.textId] }).fetch();

      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }

      const textIncludes = cacheRsp.data[oThis.textId],
        entityIdentifiersArray = [];
      if (textIncludes && textIncludes.length > 0) {
        for (let ind = 0; ind < textIncludes.length; ind++) {
          const include = textIncludes[ind],
            entityIdentifier = include.entityIdentifier;

          entityIdentifiersArray.push(entityIdentifier);
        }

        await new TextIncludeModel().deleteRowsForTextId(oThis.textId, entityIdentifiersArray);
      }

      await oThis._updateDetailsModel(null, oThis.videoId);

      return TextModel.flushCache({ ids: [oThis.textId] });
    }
  }
}

module.exports = EditDescriptionBase;

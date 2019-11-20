const rootPrefix = '../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FilterAndPublishAtMentions = require(rootPrefix + '/lib/FilterAndPublishAtMentions'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to edit video description.
 *
 * @class EditDescriptionBase
 */
class EditDescriptionBase extends ServiceBase {
  /**
   * Constructor to edit video description.
   *
   * @param {object} params
   * @param {array} params.videoDescription: Video description of video by admin.
   * @param {array} params.videoId: Video id to edited.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

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
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;
    // TODO: If existing video description is same as that of new one, dont add or delete.

    await oThis._fetchDetails();

    await oThis._fetchCreatorUser();

    await oThis._updateVideoDescription();

    await oThis._flushCache();

    const promiseArray = [
      oThis._decrementVideoTagsWeightForExistingDescription(),
      oThis._filterTags(),
      oThis._filterAtMentions()
    ];

    await Promise.all(promiseArray);

    await oThis._incrementWeightsAndAddVideoTags();

    return responseHelper.successWithData({
      creatorUserId: oThis.creatorUserId,
      mentionedUserIds: oThis.mentionedUserIds
    });
  }

  /**
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
   * @returns {Promise<void>}
   * @private
   */
  async _filterAtMentions() {
    const oThis = this;

    // Filter out at mentions from video description.
    const filterAndPublishAtMentionsResp = await new FilterAndPublishAtMentions({
        text: oThis.videoDescription,
        textId: oThis.textId,
        currentUserId: oThis.creatorUserId,
        videoId: oThis.videoId,
        isReplyOnVideo: oThis.isReplyOnVideo,
        replyDetailId: oThis.replyDetailId
      }).perform(),
      videoDescriptionAtMentionsData = filterAndPublishAtMentionsResp.data;

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
   * Update video description.
   *
   * @sets oThis.textId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoDescription() {
    const oThis = this;

    let newTextId = null;

    if (CommonValidators.validateNonBlankString(oThis.text)) {
      // If textId already exists, we need to update the text model.
      if (oThis.texId) {
        const updateParams = {
          id: oThis.texId,
          text: oThis.text
        };

        await new TextModel().updateById(updateParams);

        return TextModel.flushCache({ ids: [oThis.texId] });
        // Return here so there is no update in video detail.
      }

      const insertParams = {
        text: oThis.text,
        kind: textConstants.videoDescriptionKind
      };

      // Create new entry in texts table.
      const textRow = await new TextModel().insertText(insertParams);

      oThis.texId = textRow.insertId;
    } else {
      if (oThis.texId) {
        await new TextModel().deleteById({ id: oThis.texId });

        return TextModel.flushCache({ ids: [oThis.texId] });
      }

      newTextId = null;
    }

    await oThis._updateDetailsModel(oThis.textId, oThis.videoId);
  }
}

module.exports = EditDescriptionBase;
